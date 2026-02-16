import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
    constructor(private prisma: PrismaService) { }

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

        return team;
    }
}
