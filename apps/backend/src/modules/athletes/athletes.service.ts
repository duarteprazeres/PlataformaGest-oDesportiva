import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

import { CreatePassportDto } from './dto/create-passport.dto';
import { SearchAthleteDto } from './dto/search-athlete.dto';
import { TerminateLinkDto } from './dto/terminate-link.dto';

@Injectable()
export class AthletesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) { }

  // Helper to generate short Public ID
  private generatePublicId(): string {
    // Generate 6 random chars (hex) + 'PT-' => 9 chars total (fits in VarChar(10))
    return 'PT-' + randomBytes(3).toString('hex').toUpperCase();
  }

  // 1. Create Athlete Passport
  async createPassport(parentId: string, data: CreatePassportDto) {
    const publicId = this.generatePublicId();

    return this.prisma.athlete.create({
      data: {
        globalParentId: parentId,
        publicId,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: new Date(data.birthDate),
        gender: data.gender,
        citizenCard: data.citizenCard || null,
        taxId: data.taxId || null,
      },
    });
  }

  // 2. Search Athlete for Linking (Club searches by ID, CC, or NIF)
  async searchForLink(query: SearchAthleteDto) {
    if (!query.publicId && !query.citizenCard && !query.taxId) {
      throw new BadRequestException('Must provide at least one search criteria');
    }

    const where: Prisma.AthleteWhereInput = {};
    if (query.publicId) where.publicId = query.publicId;
    if (query.citizenCard) where.citizenCard = query.citizenCard;
    if (query.taxId) where.taxId = query.taxId;

    const athlete = await this.prisma.athlete.findFirst({
      where: where,
      select: {
        id: true,
        publicId: true,
        firstName: true,
        lastName: true,
        // Return basic info for confirmation
        birthDate: true,
        currentClubId: true,
      },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');

    return athlete;
  }

  async findById(id: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id },
      include: {
        players: {
          where: {
            OR: [{ status: 'ACTIVE' }, { status: 'PENDING_WITHDRAWAL' }],
          },
          include: {
            currentTeam: { select: { id: true, name: true } },
            parent: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            matchCallups: {
              where: { played: true },
              select: {
                goalsScored: true,
                minutesPlayed: true,
                yellowCards: true,
                redCard: true,
              },
            },
          },
        },
      },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');

    const player = athlete.players[0];
    const callups = player?.matchCallups || [];

    return {
      id: athlete.id,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      birthDate: athlete.birthDate,
      photoUrl: player?.photoUrl || null,
      height: player?.heightCm || null,
      weight: player?.weightKg ? Number(player.weightKg) : null,
      jerseyNumber: player?.jerseyNumber || null,
      position: player?.preferredPosition || null,
      status: player?.status || 'FREE_AGENT',
      currentTeam: player?.currentTeam || null,
      guardian: player?.parent ? {
        name: `${player.parent.firstName} ${player.parent.lastName}`,
        email: player.parent.email,
        phone: '',
        relation: 'Encarregado de Educação',
      } : null,
      stats: {
        games: callups.length,
        goals: callups.reduce((s: number, c: { goalsScored: number }) => s + c.goalsScored, 0),
        assists: 0,
        yellowCards: callups.reduce((s: number, c: { yellowCards: number }) => s + c.yellowCards, 0),
        redCards: callups.filter((c: { redCard: boolean }) => c.redCard).length,
        minutesPlayed: callups.reduce((s: number, c: { minutesPlayed: number }) => s + c.minutesPlayed, 0),
      },
      attendance: {
        totalSessions: 0,
        attended: 0,
        justified: 0,
        missed: 0,
        streak: 0,
        log: [],
      },
    };
  }



  // 2b. Get Athlete by Public ID (Legacy/Direct)
  async findByPublicId(publicId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { publicId },
      include: {
        globalParent: {
          select: { firstName: true, email: true },
        },
        // Don't expose sensitive data openly, just confirmation info
      },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');
    return athlete;
  }

  // 3. Initiate Transfer (Club requests Athlete)
  async requestTransfer(clubId: string, publicId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { publicId },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');

    if (athlete.currentClubId) {
      throw new BadRequestException(
        'Athlete is currently active in another club. Withdrawal required first.',
      );
    }

    // Check for pending requests
    const pending = await this.prisma.transferRequest.findFirst({
      where: {
        athleteId: athlete.id,
        toClubId: clubId,
        status: 'PENDING',
      },
    });

    if (pending) {
      return pending; // Already requested
    }

    return this.prisma.transferRequest.create({
      data: {
        athleteId: athlete.id,
        toClubId: clubId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
      },
    });
  }

  // 4. Parent Approves Transfer
  async approveTransfer(parentId: string, requestId: string) {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: requestId },
      include: { athlete: true },
    });

    if (!request) throw new NotFoundException('Request not found');

    if (request.athlete.globalParentId !== parentId) {
      throw new ForbiddenException('Not authorized');
    }

    if (request.status !== 'PENDING') throw new BadRequestException('Request not pending');

    // Execute Transfer
    return this.prisma.$transaction(async (tx) => {
      await tx.transferRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      await tx.athlete.update({
        where: { id: request.athleteId },
        data: { currentClubId: request.toClubId },
      });

      // Import data to Player table
      const player = await tx.player.create({
        data: {
          clubId: request.toClubId,
          athleteId: request.athlete.id,

          firstName: request.athlete.firstName,
          lastName: request.athlete.lastName,
          birthDate: request.athlete.birthDate,
          gender: request.athlete.gender,
          citizenCardNumber: request.athlete.citizenCard,
          taxId: request.athlete.taxId,
          medicalConditions: request.athlete.medicalConditions,
          allergies: request.athlete.allergies,

          // Temporary placeholder for parentId since we need to resolve the User.
          parentId: await this.findOrCreateUserForClub(
            tx,
            request.toClubId,
            request.athlete.globalParentId,
          ),
        },
      });

      return player;
    });
  }

  private async findOrCreateUserForClub(
    tx: Prisma.TransactionClient,
    clubId: string,
    globalParentId: string,
  ): Promise<string> {
    // Check if GlobalParent has a User in this club linked
    const globalParent = await tx.globalParent.findUnique({
      where: { id: globalParentId },
    });

    if (!globalParent) {
      throw new NotFoundException('Global Parent not found');
    }

    const existingUser = await tx.user.findFirst({
      where: {
        clubId,
        globalParentId,
      },
    });

    if (existingUser) return existingUser.id;

    // Else create a User for this club
    const newUser = await tx.user.create({
      data: {
        clubId,
        globalParentId,
        email: globalParent.email,
        passwordHash: globalParent.passwordHash, // Inherit password
        firstName: globalParent.firstName,
        lastName: globalParent.lastName,
        role: 'PARENT',
        isActive: true,
      },
    });

    return newUser.id;
  }

  // 5. Get My Athletes (For Parent Dashboard)
  async findAllByParent(parentId: string) {
    return this.prisma.athlete.findMany({
      where: { globalParentId: parentId },
      include: {
        transferRequests: {
          where: { status: 'PENDING' },
          include: { toClub: { select: { name: true } } },
        },
      },
    });
  }

  // 6. Get Athlete History
  async getAthleteHistory(athleteId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        players: {
          include: {
            club: { select: { id: true, name: true } },
            currentTeam: { select: { name: true } },
            teamHistory: {
              include: { team: { select: { name: true } } },
              orderBy: { joinedAt: 'desc' },
            },
            matchCallups: {
              select: {
                goalsScored: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');

    // Aggregate history from all player records
    const clubs = athlete.players.map((player) => {
      const totalMatches = player.matchCallups.length;
      const totalGoals = player.matchCallups.reduce((sum, m) => sum + m.goalsScored, 0);

      // Get the latest team history or current team
      const latestHistory = player.teamHistory[0];

      return {
        clubId: player.club.id,
        clubName: player.club.name,
        teamName: latestHistory?.team.name || player.currentTeam?.name,
        joinedAt: player.createdAt,
        leftAt: player.status === 'LEFT' ? player.updatedAt : null,
        matchesPlayed: totalMatches,
        goalsScored: totalGoals,
      };
    });

    const totalMatches = athlete.players.flatMap((p) => p.matchCallups).length;
    const totalGoals = athlete.players
      .flatMap((p) => p.matchCallups)
      .reduce((sum, m) => sum + m.goalsScored, 0);

    return {
      athleteId: athlete.id,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      clubs,
      totalClubs: clubs.length,
      totalMatches,
      totalGoals,
    };
  }

  // 7. Get Current Club Status
  async getCurrentClub(athleteId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        players: {
          where: {
            OR: [{ status: 'ACTIVE' }, { status: 'PENDING_WITHDRAWAL' }],
          },
          include: {
            club: { select: { id: true, name: true, logoUrl: true } },
            currentTeam: { select: { name: true } },
          },
        },
      },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');

    // If no active/pending player, athlete is free agent
    if (athlete.players.length === 0) {
      return {
        athleteId: athlete.id,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        status: 'FREE_AGENT' as const,
      };
    }

    const player = athlete.players[0];
    const result: Record<string, unknown> = {
      athleteId: athlete.id,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      clubId: player.club.id,
      clubName: player.club.name,
      clubLogoUrl: player.club.logoUrl,
      teamName: player.currentTeam?.name,
      status: player.status,
    };

    if (player.status === 'PENDING_WITHDRAWAL' && player.withdrawalRequestedAt) {
      const coolOffEnds = new Date(player.withdrawalRequestedAt.getTime() + 24 * 60 * 60 * 1000);
      const hoursRemaining = Math.max(
        0,
        Math.floor((coolOffEnds.getTime() - Date.now()) / (1000 * 60 * 60)),
      );

      result.withdrawalRequestedAt = player.withdrawalRequestedAt;
      result.coolOffEndsAt = coolOffEnds;
      result.hoursRemaining = hoursRemaining;
    }

    return result;
  }

  // 8. Get Athlete Stats
  async getAthleteStats(athleteId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        players: {
          include: {
            club: { select: { id: true, name: true } },
            currentTeam: { select: { id: true, name: true } },
            teamHistory: { select: { teamId: true } },
            matchCallups: {
              where: { played: true }, // Only count actually played matches
              select: {
                goalsScored: true,
                coachRating: true,
              },
            },
          },
        },
      },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');

    const allCallups = athlete.players.flatMap((p) => p.matchCallups);

    const totalMatches = allCallups.length;
    const totalGoals = allCallups.reduce((sum, m) => sum + m.goalsScored, 0);

    // Calculate average coach rating
    const ratingsWithValues = allCallups.filter((m) => m.coachRating !== null);
    const avgRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, m) => sum + Number(m.coachRating), 0) /
        ratingsWithValues.length
        : null;

    const uniqueClubs = new Set(athlete.players.map((p) => p.club.id));
    const uniqueTeams = new Set(
      athlete.players.flatMap((p) =>
        [...p.teamHistory.map((h) => h.teamId), p.currentTeam?.id].filter(Boolean),
      ),
    );

    const firstRegistration =
      athlete.players.length > 0
        ? new Date(Math.min(...athlete.players.map((p) => p.createdAt.getTime())))
        : null;

    const yearsActive = firstRegistration
      ? new Date().getFullYear() - firstRegistration.getFullYear()
      : 0;

    // Determine current status
    const activePlayer = athlete.players.find(
      (p) => p.status === 'ACTIVE' || p.status === 'PENDING_WITHDRAWAL',
    );
    const currentStatus = activePlayer ? activePlayer.status : 'FREE_AGENT';

    return {
      athleteId: athlete.id,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      totalMatches,
      totalGoals,
      avgCoachRating: avgRating,
      clubsCount: uniqueClubs.size,
      teamsCount: uniqueTeams.size,
      yearsActive,
      firstRegistration,
      currentStatus,
    };
  }

  async getUpcomingTrainings(athleteId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        players: true,
      },
    });

    if (!athlete) throw new Error('Athlete not found');

    const teamIds = athlete.players.map((p) => p.currentTeamId).filter(Boolean) as string[];

    return this.prisma.training.findMany({
      where: {
        teamId: { in: teamIds },
        scheduledDate: { gte: new Date() },
        isCancelled: false,
      },
      include: {
        team: true,
        absenceNotices: {
          where: { athleteId: athleteId },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 5,
    });
  }

  // 9. Request Withdrawal (Parent initiates)
  async requestWithdrawal(parentId: string, athleteId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        players: {
          where: { status: 'ACTIVE' },
          include: { club: true },
        },
      },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');
    if (athlete.globalParentId !== parentId) throw new ForbiddenException('Not authorized');

    if (athlete.players.length === 0) {
      throw new BadRequestException('Athlete is not currently active in any club');
    }

    const player = athlete.players[0];

    // Update player to PENDING_WITHDRAWAL
    const updatedPlayer = await this.prisma.player.update({
      where: { id: player.id },
      data: {
        status: 'PENDING_WITHDRAWAL',
        withdrawalRequestedAt: new Date(),
      },
    });

    // Notify Club Admins
    const clubAdmins = await this.prisma.user.findMany({
      where: {
        clubId: player.club.id,
        role: 'CLUB_ADMIN',
      },
    });

    for (const admin of clubAdmins) {
      await this.notificationsService.create({
        clubId: player.club.id,
        userId: admin.id,
        type: 'WITHDRAWAL_REQUEST',
        title: 'Pedido de Rescisão',
        message: `O atleta ${athlete.firstName} ${athlete.lastName} solicitou a rescisão do contrato via Portal dos Pais.`,
        relatedEntityType: 'PLAYER',
        relatedEntityId: player.id,
        actionUrl: `/dashboard/players/${player.id}`, // Link to player details
      });
    }

    return updatedPlayer;
  }

  // 10. Cancel Withdrawal (During 24h cool-off)
  async cancelWithdrawal(parentId: string, athleteId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        players: {
          where: { status: 'PENDING_WITHDRAWAL' },
        },
      },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');
    if (athlete.globalParentId !== parentId) throw new ForbiddenException('Not authorized');

    if (athlete.players.length === 0) {
      throw new BadRequestException('No pending withdrawal found');
    }

    const player = athlete.players[0];

    // Revert to ACTIVE
    return this.prisma.player.update({
      where: { id: player.id },
      data: {
        status: 'ACTIVE',
        withdrawalRequestedAt: null,
      },
    });
  }

  // 11. Terminate Link (Club-initiated withdrawal/finalization)
  async terminateLink(clubId: string, playerId: string, data: TerminateLinkDto) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: {
        club: true,
        athlete: true,
      },
    });

    if (!player) throw new NotFoundException('Player not found');
    if (player.clubId !== clubId) throw new ForbiddenException('Not authorized');

    // Update player status to LEFT
    const updatedPlayer = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        status: 'LEFT',
        withdrawalReason: data.reason,
        withdrawalLetterUrl: data.withdrawalLetterUrl,
        destinationClubEmail: data.destinationClubEmail,
        documentsSentAt: data.sendEmail && data.destinationClubEmail ? new Date() : null,
      },
    });

    // Update athlete's currentClubId to null
    if (player.athleteId) {
      await this.prisma.athlete.update({
        where: { id: player.athleteId },
        data: { currentClubId: null },
      });
    }

    // Send email if requested
    if (data.sendEmail && data.destinationClubEmail) {
      const attachments: { filename: string; content: string }[] = [];

      // Add withdrawal letter if exists
      if (data.withdrawalLetterUrl) {
        // In production, we'd fetch the file from storage
        // For now, just log it
        attachments.push({
          filename: 'Carta_Desvinculacao.pdf',
          content: `[File URL: ${data.withdrawalLetterUrl}]`,
        });
      }

      // Add medical certificate if exists
      if (player.medicalCertificateUrl) {
        attachments.push({
          filename: 'Exame_Medico.pdf',
          content: `[File URL: ${player.medicalCertificateUrl}]`,
        });
      }

      await this.mailService.sendWithdrawalPackage(
        data.destinationClubEmail,
        `${player.firstName} ${player.lastName}`,
        player.club.name,
        attachments,
      );
    }

    return updatedPlayer;
  }
}
