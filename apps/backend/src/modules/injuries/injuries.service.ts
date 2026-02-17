import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInjuryDto } from './dto/create-injury.dto';
import { UpdateInjuryDto } from './dto/update-injury.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InjuriesService {
  constructor(private prisma: PrismaService) {}

  async create(clubId: string, userId: string, createInjuryDto: CreateInjuryDto) {
    // 1. Create Injury Record
    const injury = await this.prisma.injury.create({
      data: {
        club: { connect: { id: clubId } },
        player: { connect: { id: createInjuryDto.playerId } },
        status: createInjuryDto.status, // INJURED, SICK, etc.
        name: createInjuryDto.name,
        description: createInjuryDto.description,
        startDate: new Date(createInjuryDto.startDate),
        createdByUser: { connect: { id: userId } },
      },
    });

    // 2. Update Player Status
    await this.prisma.player.update({
      where: { id: createInjuryDto.playerId, clubId },
      data: {
        medicalStatus: createInjuryDto.status,
      },
    });

    return injury;
  }

  async findAll(clubId: string, activeOnly?: boolean, playerId?: string) {
    const where: Prisma.InjuryWhereInput = { clubId };

    if (activeOnly) {
      where.endDate = null; // Still active
    }

    if (playerId) {
      where.playerId = playerId;
    }

    return this.prisma.injury.findMany({
      where,
      include: {
        player: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        createdByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(clubId: string, id: string) {
    const injury = await this.prisma.injury.findFirst({
      where: { id, clubId },
      include: {
        player: true,
      },
    });

    if (!injury) throw new NotFoundException('Lesão não encontrada');
    return injury;
  }

  async update(clubId: string, id: string, updateInjuryDto: UpdateInjuryDto) {
    const injury = await this.findOne(clubId, id);

    const updatedInjury = await this.prisma.injury.update({
      where: { id },
      data: {
        name: updateInjuryDto.name,
        description: updateInjuryDto.description,
        endDate: updateInjuryDto.endDate ? new Date(updateInjuryDto.endDate) : undefined,
      },
    });

    // If injury is closed (endDate set), revert player status to FIT
    if (updateInjuryDto.endDate) {
      await this.prisma.player.update({
        where: { id: injury.playerId },
        data: { medicalStatus: 'FIT' },
      });
    }

    return updatedInjury;
  }
}
