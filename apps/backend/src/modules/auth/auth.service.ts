import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtPayload } from './dto/jwt-payload.interface';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private metricsService: MetricsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    const cacheKey = `user:email:${email}`;
    let user: User | null | undefined = await this.cacheManager.get(cacheKey);

    if (!user) {
      this.metricsService.incrementCacheMiss('AuthService.validateUser');
      user = await this.prisma.user.findFirst({ where: { email } });
      if (user) {
        await this.cacheManager.set(cacheKey, user, 300000); // 5 min
      }
    } else {
      this.metricsService.incrementCacheHit('AuthService.validateUser');
    }

    // console.log(`Login attempt for ${email}. User found: ${!!user}`);

    if (user && user.passwordHash) {
      const isValid = await bcrypt.compare(pass, user.passwordHash);
      if (isValid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: Omit<User, 'passwordHash'>) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      clubId: user.clubId,
      role: user.role,
      globalParentId: user.globalParentId || undefined,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
