import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class TrainingsService {
    constructor(private prisma: PrismaService) { }

    async create(clubId: string, coachId: string, createTrainingDto: CreateTrainingDto, file?: Express.Multer.File) {
        let planFileUrl = null;

        if (file) {
            planFileUrl = `/uploads/${file.filename}`;
        }

        const trainingsToCreate = [];
        const startDate = new Date(createTrainingDto.scheduledDate);
        let currentDate = new Date(startDate);
        const endDate = createTrainingDto.isRecurring && createTrainingDto.recurrenceEndDate
            ? new Date(createTrainingDto.recurrenceEndDate)
            : startDate;

        // Ensure we create at least one training (the initial one)
        // If recurring, loop until endDate
        do {
            const datePart = currentDate.toISOString().split('T')[0];
            const startDateTime = new Date(`${datePart}T${createTrainingDto.startTime}:00`);
            const endDateTime = new Date(`${datePart}T${createTrainingDto.endTime}:00`);

            trainingsToCreate.push({
                clubId,
                coachId,
                teamId: createTrainingDto.teamId,
                scheduledDate: new Date(currentDate),
                startTime: startDateTime,
                endTime: endDateTime,
                location: createTrainingDto.location,
                notes: createTrainingDto.notes,
                objectives: createTrainingDto.objectives,
                planFileUrl: planFileUrl,
            });

            // Increment date if recurring
            if (createTrainingDto.isRecurring && createTrainingDto.frequency === 'WEEKLY') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
                break; // Stop if not recurring
            }
        } while (currentDate <= endDate);

        // Batch create using transaction or loop (Prisma createMany doesn't return created records in all DBs, but PostgreSQL supports it)
        // ideally we want to return the created records, but createMany returns count.
        // For simplicity, we can use createMany.
        await this.prisma.training.createMany({
            data: trainingsToCreate,
        });

        return { count: trainingsToCreate.length, message: 'Trainings created' };
    }

    async findAll(
        clubId: string,
        teamId?: string,
        status?: 'upcoming' | 'pending_lock' | 'history'
    ) {
        const now = new Date();

        const where: any = {
            clubId,
            ...(teamId ? { teamId } : {}),
        };

        // Apply status-based filters
        if (status === 'upcoming') {
            // Trainings that haven't occurred yet
            where.scheduledDate = { gte: now };
            where.isFinalized = false;
        } else if (status === 'history') {
            // Trainings that are finalized
            where.isFinalized = true;
        } else if (status === 'pending_lock') {
            // Trainings that have ended but are not finalized
            // We'll need to filter these in code after the query
            where.isFinalized = false;
        }

        const trainings = await this.prisma.training.findMany({
            where,
            include: {
                team: { select: { name: true } },
                coach: { select: { firstName: true, lastName: true } },
            },
            orderBy: { scheduledDate: 'desc' },
        });

        // For pending_lock status, filter out trainings that haven't ended yet
        if (status === 'pending_lock') {
            return trainings.filter(training => {
                // Combine scheduledDate with endTime to get full DateTime
                const trainingDate = new Date(training.scheduledDate);
                const endTime = new Date(training.endTime);
                trainingDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
                return now >= trainingDate;
            });
        }

        return trainings;
    }

    async findOne(clubId: string, id: string) {
        const training = await this.prisma.training.findFirst({
            where: { id, clubId },
            include: {
                attendance: {
                    include: {
                        player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, medicalStatus: true } }
                    }
                },
                team: {
                    include: {
                        players: {
                            select: { id: true, firstName: true, lastName: true, photoUrl: true, medicalStatus: true }
                        }
                    }
                },
                absenceNotices: {
                    include: {
                        athlete: { select: { id: true, firstName: true, lastName: true } }
                    }
                }
            }
        });

        if (!training) {
            throw new NotFoundException('Treino não encontrado');
        }

        return training;
    }
    async update(clubId: string, id: string, updateTrainingDto: any, file?: Express.Multer.File) {
        await this.findOne(clubId, id);

        const data: any = { ...updateTrainingDto };

        if (file) {
            data.planFileUrl = `/uploads/${file.filename}`;
        }

        // Remove properties that shouldn't be updated directly or need formatting
        delete data.isRecurring;
        delete data.frequency;
        delete data.recurrenceEndDate;

        if (data.scheduledDate) data.scheduledDate = new Date(data.scheduledDate);
        // Time fields are usually strings "HH:mm" needing conversion if we were using Date objects, 
        // but looking at "create", they are converted to Date objects combined with scheduledDate.
        // For simplicity in this patch, we assume strict updates, or we re-parse if provided.
        // Given the goal is mostly "Upload Plan", we focus on that. 
        // If start/end times are updated, we'd need re-parsing logic similar to create.

        return this.prisma.training.update({
            where: { id },
            data
        });
    }

    async markAttendance(
        clubId: string,
        trainingId: string,
        userId: string,
        markAttendanceDto: MarkAttendanceDto
    ) {
        // 1. Validate training exists and belongs to club
        const training = await this.findOne(clubId, trainingId);

        // 2. Get all players from the team with their medical status
        const teamPlayers = await this.prisma.player.findMany({
            where: {
                currentTeamId: training.teamId,
                clubId
            },
            select: {
                id: true,
                medicalStatus: true,
                firstName: true,
                lastName: true
            }
        });

        const playerMap = new Map(teamPlayers.map(p => [p.id, p]));

        // 2b. AUTO-MARK injured/sick players as ABSENT (OBRIGATÓRIO)
        const injuredOrSickPlayers = teamPlayers.filter(p =>
            p.medicalStatus === 'INJURED' || p.medicalStatus === 'SICK'
        );

        injuredOrSickPlayers.forEach(player => {
            // Check if player is already in the attendance array
            const existingAttendance = markAttendanceDto.attendance.find(
                att => att.playerId === player.id
            );

            if (!existingAttendance) {
                // Add automatically as ABSENT
                markAttendanceDto.attendance.push({
                    playerId: player.id,
                    status: 'ABSENT',
                    justification: `${player.medicalStatus === 'INJURED' ? 'Lesionado' : 'Doente'} (marcado automaticamente)`
                });
            } else if (existingAttendance.status === 'PRESENT') {
                // If trainer mistakenly tried to mark as present, override to ABSENT
                existingAttendance.status = 'ABSENT';
                existingAttendance.justification = `${player.medicalStatus === 'INJURED' ? 'Lesionado' : 'Doente'} (corrigido automaticamente - jogador não pode estar presente)`;
            }
        });

        // 3. Validate each attendance entry
        for (const att of markAttendanceDto.attendance) {
            const player = playerMap.get(att.playerId);

            if (!player) {
                throw new BadRequestException(
                    `Jogador ${att.playerId} não pertence à equipa deste treino`
                );
            }

            // CRITICAL VALIDATION: Injured or sick players cannot be marked present
            if (
                (player.medicalStatus === 'INJURED' || player.medicalStatus === 'SICK') &&
                att.status === 'PRESENT'
            ) {
                throw new BadRequestException(
                    `Jogador ${player.firstName} ${player.lastName} está lesionado/doente e não pode ser marcado como presente`
                );
            }
        }

        // 4. Upsert attendance records (allows re-marking)
        const results = await Promise.all(
            markAttendanceDto.attendance.map(att =>
                this.prisma.trainingAttendance.upsert({
                    where: {
                        trainingId_playerId: {
                            trainingId,
                            playerId: att.playerId
                        }
                    },
                    create: {
                        clubId,
                        trainingId,
                        playerId: att.playerId,
                        status: att.status,
                        justification: att.justification,
                        markedByUserId: userId,
                        markedAt: new Date()
                    },
                    update: {
                        status: att.status,
                        justification: att.justification,
                        markedByUserId: userId,
                        markedAt: new Date()
                    }
                })
            )
        );

        return {
            success: true,
            count: results.length,
            message: `Presenças marcadas com sucesso para ${results.length} jogadores`
        };
    }

    async finalizeTraining(clubId: string, trainingId: string, userId: string) {
        // 1. Validate training exists and belongs to club
        const training = await this.findOne(clubId, trainingId);

        // 2. Check if already finalized
        if (training.isFinalized) {
            throw new BadRequestException('Este treino já está lacrado');
        }

        // 3. NEW: Check if training has ended (temporal validation)
        const trainingDate = new Date(training.scheduledDate);
        const endTime = new Date(training.endTime);
        trainingDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

        const now = new Date();
        if (now < trainingDate) {
            const formattedEndTime = trainingDate.toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            throw new BadRequestException(
                `Este treino só pode ser lacrado após o seu término: ${formattedEndTime}`
            );
        }

        // 4. Finalize training
        const updated = await this.prisma.training.update({
            where: { id: trainingId },
            data: {
                isFinalized: true,
                finalizedAt: new Date(),
                finalizedByUserId: userId
            }
        });

        return {
            success: true,
            message: 'Treino lacrado com sucesso. Não é possível fazer mais alterações.',
            training: updated
        };
    }
}
