import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { PrismaService } from '../../database/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePlayerDto } from './dto/create-player.dto';
import { Cache } from 'cache-manager';

describe('PlayersService', () => {
  let service: PlayersService;
  let prisma: PrismaService;
  let cacheManager: Cache;
  let metricsService: MetricsService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
    },
    team: {
      findFirst: jest.fn(),
    },
    player: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockMetricsService = {
    incrementCacheHit: jest.fn(),
    incrementCacheMiss: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const clubId = 'club-123';
    const createDto: CreatePlayerDto = {
      firstName: 'John',
      lastName: 'Doe',
      birthDate: '2010-01-01',
      parentId: 'parent-123',
      currentTeamId: 'team-123',
      gender: 'M',
      jerseyNumber: 10,
    };

    it('should successfully create a player', async () => {
      // Mock parent found
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'parent-123', clubId });
      // Mock team found
      mockPrismaService.team.findFirst.mockResolvedValue({ id: 'team-123', clubId });
      // Mock player creation
      mockPrismaService.player.create.mockResolvedValue({ id: 'player-1', ...createDto, clubId });

      const result = await service.create(clubId, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('player-1');
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: createDto.parentId, clubId },
      });
      expect(prisma.team.findFirst).toHaveBeenCalledWith({
        where: { id: createDto.currentTeamId, clubId },
      });
      expect(prisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createDto,
          clubId,
        }),
      });
    });

    it('should throw BadRequestException if parent not found in club', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.create(clubId, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if team not found in club', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'parent-123' });
      mockPrismaService.team.findFirst.mockResolvedValue(null);

      await expect(service.create(clubId, createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const clubId = 'club-123';

    it('should return players for a club', async () => {
      const players = [{ id: 'p1' }, { id: 'p2' }];
      mockPrismaService.player.findMany.mockResolvedValue(players);

      const result = await service.findAll(clubId);

      expect(result).toEqual(players);
      expect(prisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clubId },
        }),
      );
    });

    it('should filter by teamId if provided', async () => {
      const players = [{ id: 'p1' }];
      mockPrismaService.player.findMany.mockResolvedValue(players);

      await service.findAll(clubId, 'team-123');

      expect(prisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clubId, currentTeamId: 'team-123' },
        }),
      );
    });
  });

  describe('findOne', () => {
    const clubId = 'club-123';
    const playerId = 'player-123';
    const player = { id: playerId, clubId, firstName: 'John' };

    it('should return cached player if available', async () => {
      mockCacheManager.get.mockResolvedValue(player);

      const result = await service.findOne(clubId, playerId);

      expect(result).toEqual(player);
      expect(metricsService.incrementCacheHit).toHaveBeenCalled();
      expect(prisma.player.findFirst).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.player.findFirst.mockResolvedValue(player);

      const result = await service.findOne(clubId, playerId);

      expect(result).toEqual(player);
      expect(metricsService.incrementCacheMiss).toHaveBeenCalled();
      expect(prisma.player.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: playerId, clubId },
        }),
      );
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException if player not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.player.findFirst.mockResolvedValue(null);

      await expect(service.findOne(clubId, playerId)).rejects.toThrow(NotFoundException);
    });
  });
});
