import { Test, TestingModule } from '@nestjs/testing';
import { TrainingsController } from './trainings.controller';
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { UpdateTrainingDto } from './dto/update-training.dto';

describe('TrainingsController', () => {
    let controller: TrainingsController;
    let service: TrainingsService;

    const mockTrainingsService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        markAttendance: jest.fn(),
        finalizeTraining: jest.fn(),
    };

    const mockUser = {
        id: 'user-123',
        clubId: 'club-123',
        email: 'coach@example.com',
        role: 'COACH',
    };

    const mockRequest = {
        user: mockUser,
    } as unknown as RequestWithUser;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TrainingsController],
            providers: [
                {
                    provide: TrainingsService,
                    useValue: mockTrainingsService,
                },
            ],
        }).compile();

        controller = module.get<TrainingsController>(TrainingsController);
        service = module.get<TrainingsService>(TrainingsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a training', async () => {
            const createDto: CreateTrainingDto = {
                teamId: 'team-1',
                scheduledDate: '2026-03-01',
                startTime: '18:00',
                endTime: '19:30',
                location: 'Stadium',
                notes: 'Test',
                isRecurring: false,
            };
            const result = { id: 'training-1', ...createDto };
            const file = { buffer: Buffer.from('file') } as Express.Multer.File;

            mockTrainingsService.create.mockResolvedValue(result);

            expect(await controller.create(mockRequest, createDto, file)).toBe(result);
            expect(service.create).toHaveBeenCalledWith(mockUser.clubId, mockUser.id, createDto, file);
        });
    });

    describe('findAll', () => {
        it('should return trainings', async () => {
            const result = [{ id: 'training-1' }];
            mockTrainingsService.findAll.mockResolvedValue(result);

            expect(await controller.findAll(mockRequest)).toBe(result);
            expect(service.findAll).toHaveBeenCalledWith(mockUser.clubId, undefined, undefined);
        });
    });

    describe('findOne', () => {
        it('should return a training', async () => {
            const result = { id: 'training-1' };
            mockTrainingsService.findOne.mockResolvedValue(result);

            expect(await controller.findOne(mockRequest, 'training-1')).toBe(result);
            expect(service.findOne).toHaveBeenCalledWith(mockUser.clubId, 'training-1');
        });
    });

    describe('update', () => {
        it('should update a training', async () => {
            const updateDto: UpdateTrainingDto = { notes: 'Updated' };
            const result = { id: 'training-1', ...updateDto };
            mockTrainingsService.update.mockResolvedValue(result);

            expect(await controller.update(mockRequest, 'training-1', updateDto)).toBe(result);
            expect(service.update).toHaveBeenCalledWith(mockUser.clubId, 'training-1', updateDto, undefined);
        });
    });

    describe('markAttendance', () => {
        it('should mark attendance', async () => {
            const dto = { attendance: [] };
            const result = { success: true };
            mockTrainingsService.markAttendance.mockResolvedValue(result);

            expect(await controller.markAttendance(mockRequest, 'training-1', dto)).toBe(result);
            expect(service.markAttendance).toHaveBeenCalledWith(mockUser.clubId, 'training-1', mockUser.id, dto);
        });
    });

    describe('finalizeTraining', () => {
        it('should finalize training', async () => {
            const result = { success: true, isFinalized: true };
            mockTrainingsService.finalizeTraining.mockResolvedValue(result);

            expect(await controller.finalizeTraining(mockRequest, 'training-1')).toBe(result);
            expect(service.finalizeTraining).toHaveBeenCalledWith(mockUser.clubId, 'training-1', mockUser.id);
        });
    });
});
