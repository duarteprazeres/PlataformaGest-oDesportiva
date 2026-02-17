import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private metricsService: MetricsService,
  ) {}

  async create(clubId: string, data: CreateTeamDto) {
    return this.prisma.team.create({
      data: {
        ...data,
        clubId,
      },
    });
  }

  async findAll(clubId: string, seasonId?: string) {
    return this.prisma.team.findMany({
      where: {
        clubId,
        ...(seasonId ? { seasonId } : {}),
      },
      include: {
        headCoach: {
          select: { id: true, firstName: true, lastName: true },
        },
        season: true,
        _count: {
          select: { players: true },
        },
      },
    });
  }

  async findOne(clubId: string, id: string) {
    const cacheKey = `team:${clubId}:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.metricsService.incrementCacheHit('TeamsService.findOne');
      return cached;
    }
    this.metricsService.incrementCacheMiss('TeamsService.findOne');

    const team = await this.prisma.team.findFirst({
      where: { id, clubId },
      include: {
        players: true,
        headCoach: true,
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found in this club`);
    }

    await this.cacheManager.set(cacheKey, team, 1800000); // 30 min
    return team;
  }
}
