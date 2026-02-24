import {
  Injectable, NotFoundException, BadRequestException, Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { MailService } from '../mail/mail.service';
import cloudinary from '../../config/cloudinary.config';

@Injectable()
export class PlayersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private metricsService: MetricsService,
    private mailService: MailService,
  ) { }

  async create(clubId: string, data: CreatePlayerDto) {
    const parent = await this.prisma.user.findFirst({
      where: { id: data.parentId, clubId },
    });
    if (!parent) throw new BadRequestException('Parent not found in this club');

    if (data.currentTeamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: data.currentTeamId, clubId },
      });
      if (!team) throw new BadRequestException('Team not found in this club');
    }

    return this.prisma.player.create({
      data: { ...data, birthDate: new Date(data.birthDate), clubId },
    });
  }

  async findAll(clubId: string, teamId?: string) {
    const where: Prisma.PlayerWhereInput = { clubId };
    if (teamId) where.currentTeamId = teamId;

    return this.prisma.player.findMany({
      where,
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
      include: { currentTeam: true, parent: true },
    });

    if (!player) throw new NotFoundException(`Player ${id} not found`);

    await this.cacheManager.set(cacheKey, player, 900000);
    return player;
  }

  async update(clubId: string, id: string, data: UpdatePlayerDto) {
    await this.findOne(clubId, id);

    if (data.currentTeamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: data.currentTeamId, clubId },
      });
      if (!team) throw new BadRequestException('Team not found in this club');
    }

    const updated = await this.prisma.player.update({
      where: { id },
      data,
      include: { currentTeam: true, parent: true },
    });

    await this.cacheManager.del(`player:${clubId}:${id}`);
    return updated;
  }

  async uploadPhoto(clubId: string, id: string, fileBuffer: Buffer, mimetype: string) {
    await this.findOne(clubId, id);

    const photoUrl = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `players/${clubId}`, public_id: id, overwrite: true, resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        },
      );
      uploadStream.end(fileBuffer);
    });

    const updated = await this.prisma.player.update({
      where: { id },
      data: { photoUrl },
    });

    await this.cacheManager.del(`player:${clubId}:${id}`);
    return updated;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: 'LEFT',
      withdrawalReason: data.reason,
      destinationClubEmail: data.destinationEmail,
      withdrawalLetterUrl: data.letterUrl,
      currentTeamId: null,
      athleteId: null,
      withdrawalRequestedAt: new Date(),
    };

    if (data.sendEmail && data.destinationEmail && data.letterUrl) {
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

    await this.cacheManager.del(`player:${clubId}:${playerId}`);
    return updated;
  }
}
