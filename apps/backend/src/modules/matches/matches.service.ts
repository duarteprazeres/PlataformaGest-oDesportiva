import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateCallupStatsDto } from './dto/update-callup-stats.dto';

@Injectable()
export class MatchesService {
    constructor(private prisma: PrismaService) { }

    // 1. Create Match
    async createMatch(clubId: string, data: CreateMatchDto) {
        // Verify team belongs to club
        const team = await this.prisma.team.findFirst({
            where: { id: data.teamId, clubId },
        });

        if (!team) {
            throw new NotFoundException('Team not found or does not belong to this club');
        }

        // Parse time if provided
        let matchTime = null;
        if (data.matchTime) {
            const [hours, minutes] = data.matchTime.split(':');
            matchTime = new Date();
            matchTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        return this.prisma.match.create({
            data: {
                clubId,
                teamId: data.teamId,
                opponentName: data.opponentName,
                competition: data.competition,
                matchDate: new Date(data.matchDate),
                matchTime,
                location: data.location,
                isHomeMatch: data.isHomeMatch,
            },
            include: {
                team: true,
                callups: {
                    include: {
                        player: {
                            include: {
                                athlete: true,
                            },
                        },
                    },
                },
            },
        });
    }

    // 2. Get all matches by team
    async findAllByTeam(clubId: string, teamId: string) {
        return this.prisma.match.findMany({
            where: { clubId, teamId },
            include: {
                team: true,
                callups: {
                    include: {
                        player: {
                            include: {
                                athlete: true,
                            },
                        },
                    },
                },
            },
            orderBy: { matchDate: 'desc' },
        });
    }

    // 3. Get match by ID
    async findOne(clubId: string, matchId: string) {
        const match = await this.prisma.match.findFirst({
            where: { id: matchId, clubId },
            include: {
                team: true,
                callups: {
                    include: {
                        player: {
                            include: {
                                athlete: true,
                            },
                        },
                    },
                },
            },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        return match;
    }

    // 4. Update match
    async updateMatch(clubId: string, matchId: string, data: UpdateMatchDto) {
        await this.findOne(clubId, matchId); // Ensure exists and belongs to club

        return this.prisma.match.update({
            where: { id: matchId },
            data,
            include: {
                team: true,
                callups: {
                    include: {
                        player: {
                            include: {
                                athlete: true,
                            },
                        },
                    },
                },
            },
        });
    }

    // 5. Delete match
    async deleteMatch(clubId: string, matchId: string) {
        await this.findOne(clubId, matchId);

        return this.prisma.match.delete({
            where: { id: matchId },
        });
    }

    // 6. Add callup (coach convokes player)
    async addCallup(clubId: string, matchId: string, playerId: string) {
        const match = await this.findOne(clubId, matchId);

        // Verify player belongs to the team
        const player = await this.prisma.player.findFirst({
            where: { id: playerId, clubId },
        });

        if (!player || player.currentTeamId !== match.teamId) {
            throw new BadRequestException('Player not found or not in this team');
        }

        // Check if already called up
        const existing = await this.prisma.matchCallup.findUnique({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Player already called up for this match');
        }

        return this.prisma.matchCallup.create({
            data: {
                clubId,
                matchId,
                playerId,
            },
            include: {
                player: {
                    include: {
                        athlete: true,
                    },
                },
            },
        });
    }

    // 7. Confirm callup (parent confirms attendance)
    async confirmCallup(clubId: string, matchId: string, playerId: string) {
        const callup = await this.prisma.matchCallup.findUnique({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
        });

        if (!callup || callup.clubId !== clubId) {
            throw new NotFoundException('Callup not found');
        }

        return this.prisma.matchCallup.update({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
            data: {
                confirmedByParent: true,
                confirmedAt: new Date(),
            },
            include: {
                player: {
                    include: {
                        athlete: true,
                    },
                },
            },
        });
    }

    // 8. Update callup stats (coach records stats)
    async updateCallupStats(
        clubId: string,
        matchId: string,
        playerId: string,
        stats: UpdateCallupStatsDto,
    ) {
        const callup = await this.prisma.matchCallup.findUnique({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
        });

        if (!callup || callup.clubId !== clubId) {
            throw new NotFoundException('Callup not found');
        }

        return this.prisma.matchCallup.update({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
            data: {
                played: stats.played,
                minutesPlayed: stats.minutesPlayed,
                goalsScored: stats.goalsScored,
                yellowCards: stats.yellowCards,
                redCard: stats.redCard,
                coachRating: stats.coachRating,
                notes: stats.notes,
            },
            include: {
                player: {
                    include: {
                        athlete: true,
                    },
                },
            },
        });
    }

    // 9. Finalize match (mark as finished and recalculate stats)
    // 9. Finalize match (mark as finished and recalculate stats)
    // 9. Finalize match (mark as finished and recalculate stats)
    async finalizeMatch(clubId: string, matchId: string, data: { result: 'WIN' | 'DRAW' | 'LOSS', goalsFor: number, goalsAgainst: number, notes?: string }) {
        const match = await this.findOne(clubId, matchId);

        if (match.result !== 'SCHEDULED') {
            throw new BadRequestException('Match already finalized or not in SCHEDULED state');
        }

        // 1. Update Match
        const updatedMatch = await this.prisma.match.update({
            where: { id: matchId },
            data: {
                result: data.result,
                goalsFor: data.goalsFor,
                goalsAgainst: data.goalsAgainst,
                notes: data.notes,
            },
            include: {
                callups: true,
            }
        });

        // 2. Update Player Stats (PlayerTeamHistory)
        // We iterate over callups where played = true
        const playedCallups = updatedMatch.callups.filter(c => c.played);

        for (const callup of playedCallups) {
            // Find current history for this player in this team
            // Note: Simplification - assumes the player is still in the team or we update their last history entry for this team
            // Ideally we find the active history entry or create one if missing
            const history = await this.prisma.playerTeamHistory.findFirst({
                where: {
                    playerId: callup.playerId,
                    teamId: match.teamId,
                    leftAt: null // Active history
                }
            });

            if (history) {
                await this.prisma.playerTeamHistory.update({
                    where: { id: history.id },
                    data: {
                        matchesPlayed: { increment: 1 },
                        goalsScored: { increment: callup.goalsScored }
                    }
                });
            } else {
                // If no active history, try to find ANY history for this team (maybe they left?)
                // Or just ignore/log. For now, let's create one if missing is unsafe, so checking most recent
                const lastHistory = await this.prisma.playerTeamHistory.findFirst({
                    where: {
                        playerId: callup.playerId,
                        teamId: match.teamId
                    },
                    orderBy: { joinedAt: 'desc' }
                });

                if (lastHistory) {
                    await this.prisma.playerTeamHistory.update({
                        where: { id: lastHistory.id },
                        data: {
                            matchesPlayed: { increment: 1 },
                            goalsScored: { increment: callup.goalsScored }
                        }
                    });
                }
            }
        }

        return { message: 'Match finalized and stats updated', match: updatedMatch };
    }

    // 10.Get callups for a match
    async getCallups(clubId: string, matchId: string) {
        await this.findOne(clubId, matchId);

        return this.prisma.matchCallup.findMany({
            where: { matchId, clubId },
            include: {
                player: {
                    include: {
                        athlete: true,
                    },
                },
            },
        });
    }
}
