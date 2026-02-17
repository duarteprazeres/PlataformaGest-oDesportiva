import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePlayerDto } from './dto/create-player.dto';

import { MailService } from '../mail/mail.service';

@Injectable()
export class PlayersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private metricsService: MetricsService,
    private mailService: MailService,
  ) { }

  async create(clubId: string, data: CreatePlayerDto) {
    // 1. Verify Parent exists and belongs to club
    const parent = await this.prisma.user.findFirst({
      where: { id: data.parentId, clubId },
    });
    if (!parent) {
      throw new BadRequestException('Parent not found in this club');
    }

    // 2. Verify Team exists (optional)
    if (data.currentTeamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: data.currentTeamId, clubId },
      });
      if (!team) {
        throw new BadRequestException('Team not found in this club');
      }
    }

    // 3. Create Player (Trigger will ensure extra consistency)
    return this.prisma.player.create({
      data: {
        ...data,
        birthDate: new Date(data.birthDate),
        clubId,
      },
    });
  }

  async findAll(clubId: string, teamId?: string) {
    const whereClause: Prisma.PlayerWhereInput = { clubId };
    if (teamId) {
      whereClause.currentTeamId = teamId;
    }

    return this.prisma.player.findMany({
      where: whereClause,
      include: {
        currentTeam: true,
        parent: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findOne(clubId: string, id: string) {
    const cacheKey = `player:${clubId}:${id}`;
    const cached = await this.cacheManager.get<Prisma.PlayerGetPayload<{}>>(cacheKey);
    if (cached) {
      this.metricsService.incrementCacheHit('PlayersService.findOne');
      return cached;
    }
    this.metricsService.incrementCacheMiss('PlayersService.findOne');

    const player = await this.prisma.player.findFirst({
      where: { id, clubId },
      include: {
        currentTeam: true,
        parent: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found in this club`);
    }

    await this.cacheManager.set(cacheKey, player, 900000); // 15 min
    return player;
  }

  async terminateLink(
    clubId: string,
    playerId: string,
    data: {
      reason: string;
      destinationEmail?: string;
      letterUrl?: string;
      sendEmail?: boolean;
    },
  ) {
    const player = await this.findOne(clubId, playerId);

    if (player.status === 'LEFT') {
      throw new BadRequestException('Player already withdrawn');
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: 'LEFT',
      withdrawalReason: data.reason,
      destinationClubEmail: data.destinationEmail,
      withdrawalLetterUrl: data.letterUrl,
      currentTeamId: null,
      athleteId: null, // Free passport
      withdrawalRequestedAt: new Date(),
    };

    if (data.sendEmail && data.destinationEmail && data.letterUrl) {
      // Send email
      const club = await this.prisma.club.findUnique({ where: { id: clubId } });
      await this.mailService.sendWithdrawalPackage(
        data.destinationEmail,
        `${player.firstName} ${player.lastName}`,
        club?.name || 'Clube',
        [{ filename: 'Carta_Rescisao.pdf', content: data.letterUrl }],
      );
      updateData.documentsSentAt = new Date();
    }

    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: updateData,
    });

    // Invalidate cache
    const cacheKey = `player:${clubId}:${playerId}`;
    await this.cacheManager.del(cacheKey);

    return updated;
  }
}
