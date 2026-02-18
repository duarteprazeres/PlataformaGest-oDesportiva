// apps/backend/src/clubs/clubs.service.ts
import {
  Injectable, Inject, BadRequestException,
  NotFoundException, ConflictException
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../../database/prisma.service';
import { Club } from '@prisma/client';

@Injectable()
export class ClubsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private metricsService: MetricsService,
  ) { }

  private readonly PLAN_LIMITS: Record<string, { players: number; teams: number }> = {
    FREE: { players: 20, teams: 1 },
    PRO: { players: 200, teams: Infinity },
    PREMIUM: { players: Infinity, teams: Infinity },
  };

  async updateSubscription(clubId: string, newPlan: string) {
    const limits = this.PLAN_LIMITS[newPlan];
    if (!limits) {
      throw new BadRequestException('Invalid subscription plan');
    }

    if (limits.players !== Infinity || limits.teams !== Infinity) {
      const playerCount = await this.prisma.player.count({ where: { clubId } });
      const teamCount = await this.prisma.team.count({ where: { clubId } });

      if (playerCount > limits.players) {
        throw new BadRequestException(
          `Cannot downgrade to ${newPlan}. Current players (${playerCount}) exceeds limit (${limits.players})`,
        );
      }
      if (teamCount > limits.teams) {
        throw new BadRequestException(
          `Cannot downgrade to ${newPlan}. Current teams (${teamCount}) exceeds limit (${limits.teams})`,
        );
      }
    }

    return this.prisma.club.update({
      where: { id: clubId },
       { subscriptionPlan: newPlan },
    });
}

  async findBySubdomain(subdomain: string): Promise < Club > {
  const cacheKey = `club:subdomain:${subdomain}`;
  const cached = await this.cacheManager.get<Club>(cacheKey);
  if(cached) {
    this.metricsService.incrementCacheHit('ClubsService.findBySubdomain');
    return cached;
  }
    this.metricsService.incrementCacheMiss('ClubsService.findBySubdomain');

  const club = await this.prisma.club.findUnique({ where: { subdomain } });
  if(!club) {
    throw new NotFoundException(`Club with subdomain '${subdomain}' not found`);
  }

    await this.cacheManager.set(cacheKey, club, 3600000);
  return club;
}

  async create({
  name: string;
  subdomain: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  subscriptionPlan?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}) {
  // Verificar subdomain/email duplicados
  const existing = await this.prisma.club.findFirst({
    where: {
      OR: [{ subdomain: data.subdomain }, { email: data.email }],
    },
  });
  if (existing) {
    throw new ConflictException('Club with this subdomain or email already exists');
  }

  const existingUser = await this.prisma.user.findFirst({
    where: { email: data.adminEmail },
  });
  if (existingUser) {
    throw new ConflictException('User with this email already exists');
  }

  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash(data.adminPassword, 10);

  return this.prisma.$transaction(async (tx) => {
    // 1. Criar Clube
    const club = await tx.club.create({
         {
        name: data.name,
        subdomain: data.subdomain,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country ?? 'Portugal',
        taxId: data.taxId,
        subscriptionPlan: data.subscriptionPlan ?? 'FREE',
      },
      });

  // 2. Criar Admin
  const nameParts = data.adminName.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin';

  const user = await tx.user.create({
         {
      email: data.adminEmail,
      firstName,
      lastName,
      passwordHash,
      role: 'CLUB_ADMIN',
      clubId: club.id,
    },
      });

return { club, admin: { id: user.id, email: user.email } };
    });
  }

  async remove(id: string): Promise < void> {
  const now = new Date();
  await this.prisma.$transaction([
    this.prisma.club.update({ where: { id },  { deletedAt: now } }),
this.prisma.user.updateMany({ where: { clubId: id },  { deletedAt: now } }),
  this.prisma.player.updateMany({ where: { clubId: id },  { deletedAt: now } }),
  this.prisma.payment.updateMany({ where: { clubId: id },  { deletedAt: now } }),
  this.prisma.team.updateMany({ where: { clubId: id },  { deletedAt: now } }),
    ]);
  }
}
