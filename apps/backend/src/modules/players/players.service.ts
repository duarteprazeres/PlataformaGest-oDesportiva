import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayersService {
    constructor(private prisma: PrismaService) { }

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
                clubId,
            },
        });
    }

    async findAll(clubId: string, teamId?: string) {
        const whereClause: any = { clubId };
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

        return player;
    }
}
