import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../database/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  async create(data: CreateUserDto & { clubId: string }) {
    let passwordHash = '';
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = data;

    return this.prisma.user.create({
      data: {
        ...userData,
        role: userData.role || 'PARENT',
        passwordHash,
      },
    });
  }

  async findAll(clubId: string) {
    return this.prisma.user.findMany({
      where: { clubId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });
  }

  async findById(id: string) {
    const cacheKey = `user:id:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      // Ensure passwordHash is removed from cached object if it was stored with it
      const { passwordHash, ...result } = cached as User; // eslint-disable-line @typescript-eslint/no-unused-vars
      return result;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;

    await this.cacheManager.set(cacheKey, user, 300000); // 5 min

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    await this.cacheManager.del(`user:id:${id}`);
    if (user.email) await this.cacheManager.del(`user:email:${user.email}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async changePassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    await this.cacheManager.del(`user:id:${id}`);
    return { message: 'Password updated successfully' };
  }
}
