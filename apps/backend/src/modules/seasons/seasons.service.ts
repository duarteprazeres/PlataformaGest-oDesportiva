import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSeasonDto } from './dto/create-season.dto';

@Injectable()
export class SeasonsService {
  constructor(private prisma: PrismaService) {}

  async create(clubId: string, data: CreateSeasonDto) {
    // Optional: verify if club exists
    return this.prisma.season.create({
      data: {
        ...data,
        clubId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  async findAll(clubId: string) {
    return this.prisma.season.findMany({
      where: { clubId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findActive(clubId: string) {
    return this.prisma.season.findFirst({
      where: { clubId, isActive: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.season.findUnique({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const season = await this.prisma.season.findUnique({ where: { id } });
    if (!season) throw new NotFoundException('Season not found');

    return this.prisma.season.update({
      where: { id },
      data: { isActive: !season.isActive },
    });
  }
}
