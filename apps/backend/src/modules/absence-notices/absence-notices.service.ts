import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAbsenceNoticeDto } from './dto/create-absence-notice.dto';
import { ApproveNoticeDto } from './dto/approve-notice.dto';
import { DismissNoticeDto } from './dto/dismiss-notice.dto';
import { AbsenceNoticeStatus, AttendanceStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AbsenceNoticesService {
  private readonly logger = new Logger(AbsenceNoticesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateAbsenceNoticeDto, parentId: string) {
    // Verify training exists and is not too far in the past or finalized
    const training = await this.prisma.training.findUnique({
      where: { id: dto.trainingId },
      include: { team: true }, // Include team to get coaches
    });

    if (!training) {
      throw new NotFoundException('Treino não encontrado');
    }

    if (training.isFinalized) {
      throw new BadRequestException('Não é possível enviar avisos para treinos já lacrados');
    }

    // Verify athlete belongs to parent
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        id: dto.athleteId,
        globalParentId: parentId,
      },
      include: {
        players: {
          where: { clubId: training.clubId },
        },
      },
    });

    if (!athlete) {
      throw new NotFoundException(
        'Atleta não encontrado ou não associado a este encarregado de educação',
      );
    }

    const player = athlete.players[0];

    const absenceNotice = await this.prisma.absenceNotice.create({
      data: {
        athleteId: dto.athleteId,
        playerId: dto.playerId || player?.id,
        trainingId: dto.trainingId,
        submittedByParentId: parentId,
        reason: dto.reason,
        type: dto.type || 'ABSENCE',
        status: AbsenceNoticeStatus.PENDING,
      },
    });

    // Notify Coaches
    try {
      const coachesToNotify = [];
      if (training.team.headCoachId) coachesToNotify.push(training.team.headCoachId);
      if (training.team.assistantCoachId) coachesToNotify.push(training.team.assistantCoachId);
      // Also explicitly assigned coach to training, if different
      if (training.coachId && !coachesToNotify.includes(training.coachId)) {
        coachesToNotify.push(training.coachId);
      }

      const athleteName = `${athlete.firstName} ${athlete.lastName}`;
      const trainingInfo = `${training.title || 'Treino'} - ${training.scheduledDate.toLocaleDateString()}`;

      for (const coachId of coachesToNotify) {
        await this.notificationsService.create({
          clubId: training.clubId,
          userId: coachId,
          type: 'ABSENCE_NOTICE',
          title: `Novo Aviso de Ausência: ${athleteName}`,
          message: `${athleteName} informou ausência para ${trainingInfo}. Motivo: ${dto.reason || 'Sem motivo'}`,
          relatedEntityType: 'ABSENCE_NOTICE',
          relatedEntityId: absenceNotice.id,
          actionUrl: `/dashboard/trainings/${training.id}`,
        });
      }
    } catch (error) {
      this.logger.error('Failed to send notifications for absence notice', error);
      // Don't block the request if notification fails
    }

    return absenceNotice;
  }

  async findAllByParent(parentId: string) {
    return this.prisma.absenceNotice.findMany({
      where: { submittedByParentId: parentId },
      include: {
        training: true,
        athlete: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByClub(clubId: string, status?: AbsenceNoticeStatus) {
    return this.prisma.absenceNotice.findMany({
      where: {
        training: { clubId },
        status: status,
      },
      include: {
        athlete: true,
        training: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, userId: string, dto: ApproveNoticeDto) {
    const notice = await this.prisma.absenceNotice.findUnique({
      where: { id },
      include: { training: true },
    });

    if (!notice) {
      throw new NotFoundException('Aviso não encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update notice status
      const updatedNotice = await tx.absenceNotice.update({
        where: { id },
        data: {
          status: AbsenceNoticeStatus.APPROVED,
          reviewedByUserId: userId,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes,
        },
      });

      // 2. If it's an absence notice and we have a player, update/create attendance
      if (notice.type === 'ABSENCE' && notice.playerId) {
        await tx.trainingAttendance.upsert({
          where: {
            trainingId_playerId: {
              trainingId: notice.trainingId,
              playerId: notice.playerId,
            },
          },
          update: {
            status: AttendanceStatus.JUSTIFIED,
            justification: notice.reason,
          },
          create: {
            clubId: notice.training.clubId,
            trainingId: notice.trainingId,
            playerId: notice.playerId,
            status: AttendanceStatus.JUSTIFIED,
            justification: notice.reason,
          },
        });
      }

      // 3. Create Injury if requested
      if (dto.createInjury && dto.injuryData && notice.playerId) {
        const endDate = dto.injuryData.estimatedRecoveryDays
          ? new Date(Date.now() + dto.injuryData.estimatedRecoveryDays * 24 * 60 * 60 * 1000)
          : null;

        const description = `[Gravidade: ${dto.injuryData.severity}] ${dto.injuryData.description || notice.reason}`;

        await tx.injury.create({
          data: {
            clubId: notice.training.clubId,
            playerId: notice.playerId,
            status: 'INJURED',
            name: dto.injuryData.name,
            description: description,
            startDate: new Date(),
            endDate: endDate,
            createdByUserId: userId,
          },
        });

        // 4. Update Player Status to INJURED
        await tx.player.update({
          where: { id: notice.playerId },
          data: { medicalStatus: 'INJURED' },
        });
      }

      return updatedNotice;
    });
  }

  async dismiss(id: string, userId: string, dto: DismissNoticeDto) {
    return this.prisma.absenceNotice.update({
      where: { id },
      data: {
        status: AbsenceNoticeStatus.DISMISSED,
        reviewedByUserId: userId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.absenceNotice.findUnique({
      where: { id },
      include: {
        athlete: true,
        training: true,
        reviewedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }
}
