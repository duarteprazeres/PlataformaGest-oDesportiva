import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

describe('PlayersController', () => {
    let controller: PlayersController;
    let service: PlayersService;

    const mockPlayersService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    const mockUser = {
        id: 'user-123',
        clubId: 'club-123',
        email: 'test@example.com',
        role: 'COACH',
    };

    const mockRequest = {
        user: mockUser,
    } as unknown as RequestWithUser;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PlayersController],
            providers: [
                {
                    provide: PlayersService,
                    useValue: mockPlayersService,
                },
            ],
        }).compile();

        controller = module.get<PlayersController>(PlayersController);
        service = module.get<PlayersService>(PlayersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a player', async () => {
            const createDto: CreatePlayerDto = {
                firstName: 'John',
                lastName: 'Doe',
                birthDate: '2010-01-01',
                parentId: 'parent-123',
            };
            const result = { id: 'player-1', ...createDto, clubId: mockUser.clubId };

            mockPlayersService.create.mockResolvedValue(result);

            expect(await controller.create(mockRequest, createDto)).toBe(result);
            expect(service.create).toHaveBeenCalledWith(mockUser.clubId, createDto);
        });
    });

    describe('findAll', () => {
        it('should return an array of players', async () => {
            const result = [{ id: 'player-1' }];
            mockPlayersService.findAll.mockResolvedValue(result);

            expect(await controller.findAll(mockRequest)).toBe(result);
            expect(service.findAll).toHaveBeenCalledWith(mockUser.clubId, undefined);
        });

        it('should filter by teamId', async () => {
            const result = [{ id: 'player-1' }];
            const teamId = 'team-123';
            mockPlayersService.findAll.mockResolvedValue(result);

            expect(await controller.findAll(mockRequest, teamId)).toBe(result);
            expect(service.findAll).toHaveBeenCalledWith(mockUser.clubId, teamId);
        });
    });

    describe('findOne', () => {
        it('should return a player', async () => {
            const result = { id: 'player-1' };
            mockPlayersService.findOne.mockResolvedValue(result);

            expect(await controller.findOne(mockRequest, 'player-1')).toBe(result);
            expect(service.findOne).toHaveBeenCalledWith(mockUser.clubId, 'player-1');
        });
    });
});
