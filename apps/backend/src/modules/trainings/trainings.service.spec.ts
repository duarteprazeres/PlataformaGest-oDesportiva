
import { Test, TestingModule } from '@nestjs/testing';
import { TrainingsService } from './trainings.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TrainingsService', () => {
    let service: TrainingsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        training: {
            findFirst: jest.fn(),
            update: jest.fn(),
            createMany: jest.fn(),
        },
        player: {
            findMany: jest.fn(),
        },
        trainingAttendance: {
            upsert: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks(); // Clear mocks to avoid pollution between tests

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TrainingsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<TrainingsService>(TrainingsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('markAttendance', () => {
        const clubId = 'club-1';
        const trainingId = 'training-1';
        const userId = 'user-1';

        it('should successfully mark attendance for healthy player', async () => {
            // Mock training
            mockPrismaService.training.findFirst.mockResolvedValue({
                id: trainingId,
                teamId: 'team-1',
                isFinalized: false,
            });

            // Mock players
            mockPrismaService.player.findMany.mockResolvedValue([
                { id: 'player-1', medicalStatus: 'FIT', firstName: 'John', lastName: 'Doe' },
            ]);

            // Mock upsert
            mockPrismaService.trainingAttendance.upsert.mockResolvedValue({ id: 'att-1' });

            const result = await service.markAttendance(clubId, trainingId, userId, {
                attendance: [{ playerId: 'player-1', status: 'PRESENT' }],
            });

            expect(result.success).toBe(true);
            expect(prisma.trainingAttendance.upsert).toHaveBeenCalledTimes(1);
        });

        it('should auto-correct INJURED player status to ABSENT instead of throwing', async () => {
            // The logic was updated to auto-correct status to ABSENT for injured players

            // Mock training
            mockPrismaService.training.findFirst.mockResolvedValue({
                id: trainingId,
                teamId: 'team-1',
                isFinalized: false,
            });

            // Mock players (Injured)
            mockPrismaService.player.findMany.mockResolvedValue([
                { id: 'player-injured', medicalStatus: 'INJURED', firstName: 'Jane', lastName: 'Doe' },
            ]);

            mockPrismaService.trainingAttendance.upsert.mockResolvedValue({ id: 'att-injured' });

            const result = await service.markAttendance(clubId, trainingId, userId, {
                attendance: [{ playerId: 'player-injured', status: 'PRESENT' }],
            });

            expect(result.success).toBe(true);

            // Verify upsert was called with ABSENT status
            const calls = mockPrismaService.trainingAttendance.upsert.mock.calls;
            const injuredCall = calls.find(call => call[0].create.playerId === 'player-injured');

            expect(injuredCall).toBeDefined();
            expect(injuredCall[0].create.status).toBe('ABSENT');
            // Verify justification contains correction message
            expect(injuredCall[0].create.justification).toContain('corrigido automaticamente');
        });

        it('should auto-correct to ABSENT if injured player is not in the list (logic handled inside service)', async () => {
            // Mock training
            mockPrismaService.training.findFirst.mockResolvedValue({
                id: trainingId,
                teamId: 'team-1',
                isFinalized: false,
            });

            // Mock players (1 Fit, 1 Injured)
            mockPrismaService.player.findMany.mockResolvedValue([
                { id: 'player-fit', medicalStatus: 'FIT' },
                { id: 'player-injured', medicalStatus: 'INJURED' },
            ]);

            // Explicitly mock upsert to return something valid
            mockPrismaService.trainingAttendance.upsert.mockResolvedValue({ id: 'att-result' });

            const dto = { attendance: [{ playerId: 'player-fit', status: 'PRESENT' }] };

            // Call markAttendance
            await service.markAttendance(clubId, trainingId, userId, dto as any);

            // Expect upsert to be called TWICE (once for fit player, once for injured player)
            expect(prisma.trainingAttendance.upsert).toHaveBeenCalledTimes(2);

            // Check if one of the calls was for the injured player with status ABSENT
            const calls = mockPrismaService.trainingAttendance.upsert.mock.calls;
            const injuredCall = calls.find(call => call[0].create.playerId === 'player-injured');

            expect(injuredCall).toBeDefined();
            expect(injuredCall[0].create.status).toBe('ABSENT');
            // Verify justification contains auto-marked message
            expect(injuredCall[0].create.justification).toContain('marcado automaticamente');
        });
    });

    describe('finalizeTraining', () => {
        const clubId = 'club-1';
        const trainingId = 'training-1';
        const userId = 'user-1';

        it('should throw BadRequestException if training has not ended yet', async () => {
            // Future training
            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 2); // 2 hours from now

            mockPrismaService.training.findFirst.mockResolvedValue({
                id: trainingId,
                scheduledDate: futureDate,
                endTime: futureDate, // Ends in future
                isFinalized: false,
            });

            await expect(
                service.finalizeTraining(clubId, trainingId, userId)
            ).rejects.toThrow(BadRequestException);
        });

        it('should successfully finalize training if it has ended', async () => {
            // Past training
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 2); // 2 hours ago

            mockPrismaService.training.findFirst.mockResolvedValue({
                id: trainingId,
                scheduledDate: pastDate,
                endTime: pastDate, // Ended in past
                isFinalized: false,
            });

            mockPrismaService.training.update.mockResolvedValue({
                id: trainingId,
                isFinalized: true,
            });

            const result = await service.finalizeTraining(clubId, trainingId, userId);

            expect(result.success).toBe(true);
            expect(prisma.training.update).toHaveBeenCalledWith({
                where: { id: trainingId },
                data: expect.objectContaining({ isFinalized: true, finalizedByUserId: userId }),
            });
        });
    });
});
