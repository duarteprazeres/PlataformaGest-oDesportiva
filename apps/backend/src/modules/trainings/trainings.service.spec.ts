import { Test, TestingModule } from '@nestjs/testing';
import { TrainingsService } from './trainings.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTrainingDto } from './dto/create-training.dto';

describe('TrainingsService', () => {
  let service: TrainingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    training: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    player: {
      findMany: jest.fn(),
    },
    trainingAttendance: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

  describe('create', () => {
    const clubId = 'club-1';
    const coachId = 'coach-1';
    const createDto: CreateTrainingDto = {
      teamId: 'team-1',
      scheduledDate: '2026-03-01',
      startTime: '18:00',
      endTime: '19:30',
      location: 'Stadium A',
      notes: 'Test training',
      isRecurring: false,
    };

    it('should create a single training successfully', async () => {
      mockPrismaService.training.createMany.mockResolvedValue({ count: 1 });

      const result = await service.create(clubId, coachId, createDto);

      expect(result.count).toBe(1);
      expect(prisma.training.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            clubId,
            coachId,
            teamId: createDto.teamId,
            location: createDto.location,
          }),
        ]),
      });
    });

    it('should create recurring trainings correctly', async () => {
      const recurringDto: CreateTrainingDto = {
        ...createDto,
        isRecurring: true,
        frequency: 'WEEKLY',
        recurrenceEndDate: '2026-03-15', // Should create 3 trainings: 01, 08, 15
      };

      mockPrismaService.training.createMany.mockResolvedValue({ count: 3 });

      const result = await service.create(clubId, coachId, recurringDto);

      // Should be called with 3 items in the array (approx check)
      // Or correct logic called. Since we can't easily check array length in `toHaveBeenCalledWith` unless exact match,
      // we can Spy on the call argument
      const callArgs = mockPrismaService.training.createMany.mock.calls[0][0];
      expect(callArgs.data).toHaveLength(3);
      // Dates should be 7 days apart
      expect(result.count).toBe(3);
    });
  });

  describe('findAll', () => {
    const clubId = 'club-1';

    it('should return all trainings for a club', async () => {
      const trainings = [{ id: 't1' }];
      mockPrismaService.training.findMany.mockResolvedValue(trainings);

      const result = await service.findAll(clubId);

      expect(result).toEqual(trainings);
      expect(prisma.training.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clubId }),
        }),
      );
    });

    it('should filter by upcoming status', async () => {
      const trainings = [{ id: 't1' }];
      mockPrismaService.training.findMany.mockResolvedValue(trainings);

      await service.findAll(clubId, undefined, 'upcoming');

      expect(prisma.training.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId,
            isFinalized: false,
            scheduledDate: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });

    it('should verify multi-tenant isolation (clubId filter)', async () => {
      await service.findAll('other-club');
      expect(prisma.training.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clubId: 'other-club' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const clubId = 'club-1';
    const trainingId = 'training-1';

    it('should return a training if found', async () => {
      const training = { id: trainingId, clubId };
      mockPrismaService.training.findFirst.mockResolvedValue(training);

      const result = await service.findOne(clubId, trainingId);

      expect(result).toEqual(training);
      expect(prisma.training.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: trainingId, clubId },
        }),
      );
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.training.findFirst.mockResolvedValue(null);

      await expect(service.findOne(clubId, trainingId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAttendance', () => {
    const clubId = 'club-1';
    const trainingId = 'training-1';
    const userId = 'user-1';

    it('should successfully mark attendance for healthy player', async () => {
      mockPrismaService.training.findFirst.mockResolvedValue({
        id: trainingId,
        teamId: 'team-1',
        isFinalized: false,
        clubId, // Ensure clubId matches for findFirst logic
      });

      mockPrismaService.player.findMany.mockResolvedValue([
        { id: 'player-1', medicalStatus: 'FIT', firstName: 'John', lastName: 'Doe' },
      ]);

      mockPrismaService.trainingAttendance.upsert.mockResolvedValue({ id: 'att-1' });

      const result = await service.markAttendance(clubId, trainingId, userId, {
        attendance: [{ playerId: 'player-1', status: 'PRESENT' }],
      });

      expect(result.success).toBe(true);
      expect(prisma.trainingAttendance.upsert).toHaveBeenCalledTimes(1);
    });

    it('should auto-correct INJURED player status to ABSENT', async () => {
      mockPrismaService.training.findFirst.mockResolvedValue({
        id: trainingId,
        teamId: 'team-1',
        isFinalized: false,
        clubId,
      });

      mockPrismaService.player.findMany.mockResolvedValue([
        { id: 'player-injured', medicalStatus: 'INJURED', firstName: 'Jane', lastName: 'Doe' },
      ]);

      mockPrismaService.trainingAttendance.upsert.mockResolvedValue({ id: 'att-injured' });

      const result = await service.markAttendance(clubId, trainingId, userId, {
        attendance: [{ playerId: 'player-injured', status: 'PRESENT' }],
      });

      expect(result.success).toBe(true);
      const calls = mockPrismaService.trainingAttendance.upsert.mock.calls;
      const injuredCall = calls.find((call) => call[0].create.playerId === 'player-injured');
      expect(injuredCall).toBeDefined();
      expect(injuredCall[0].create.status).toBe('ABSENT');
    });
  });

  describe('finalizeTraining', () => {
    const clubId = 'club-1';
    const trainingId = 'training-1';
    const userId = 'user-1';

    it('should throw BadRequestException if training has not ended yet', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // Future

      mockPrismaService.training.findFirst.mockResolvedValue({
        id: trainingId,
        scheduledDate: futureDate,
        endTime: futureDate,
        isFinalized: false,
        clubId,
      });

      await expect(service.finalizeTraining(clubId, trainingId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully finalize training if it has ended', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2); // Past

      mockPrismaService.training.findFirst.mockResolvedValue({
        id: trainingId,
        scheduledDate: pastDate,
        endTime: pastDate,
        isFinalized: false,
        clubId,
      });

      mockPrismaService.training.update.mockResolvedValue({
        id: trainingId,
        isFinalized: true,
      });

      const result = await service.finalizeTraining(clubId, trainingId, userId);

      expect(result.success).toBe(true);
      expect(prisma.training.update).toHaveBeenCalledWith({
        where: { id: trainingId },
        data: expect.objectContaining({ isFinalized: true }),
      });
    });

    it('should throw BadRequestException if already finalized', async () => {
      mockPrismaService.training.findFirst.mockResolvedValue({
        id: trainingId,
        isFinalized: true,
        clubId,
      });

      await expect(service.finalizeTraining(clubId, trainingId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
