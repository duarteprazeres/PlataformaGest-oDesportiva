import { Test, TestingModule } from '@nestjs/testing';
import { ClubsService } from './clubs.service';
import { PrismaService } from '../../database/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ConflictException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('ClubsService', () => {
  let service: ClubsService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrismaService: any = {
    club: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<ClubsService>(ClubsService);
    // prisma = module.get<PrismaService>(PrismaService);
    // cacheManager = module.get(CACHE_MANAGER);
    // metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBySubdomain', () => {
    it('should return cached club if available', async () => {
      const mockClub = { id: 'club-id', subdomain: 'test', name: 'Test Club' };
      mockCacheManager.get.mockResolvedValue(mockClub);

      const result = await service.findBySubdomain('test');

      expect(result).toEqual(mockClub);
      expect(mockCacheManager.get).toHaveBeenCalledWith('club:subdomain:test');
      expect(mockMetricsService.incrementCacheHit).toHaveBeenCalledWith(
        'ClubsService.findBySubdomain',
      );
      expect(mockPrismaService.club.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if not in cache', async () => {
      const mockClub = { id: 'club-id', subdomain: 'test', name: 'Test Club' };
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.club.findUnique.mockResolvedValue(mockClub);

      const result = await service.findBySubdomain('test');

      expect(result).toEqual(mockClub);
      expect(mockMetricsService.incrementCacheMiss).toHaveBeenCalledWith(
        'ClubsService.findBySubdomain',
      );
      expect(mockPrismaService.club.findUnique).toHaveBeenCalledWith({
        where: { subdomain: 'test' },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith('club:subdomain:test', mockClub, 3600000);
    });

    it('should throw NotFoundException if club not found in DB', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.club.findUnique.mockResolvedValue(null);

      await expect(service.findBySubdomain('test')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Club',
      subdomain: 'new',
      email: 'club@test.com',
      adminName: 'Admin User',
      adminEmail: 'admin@test.com',
      adminPassword: 'password123',
    };

    it('should throw ConflictException if subdomain already exists', async () => {
      mockPrismaService.club.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if admin email already exists', async () => {
      mockPrismaService.club.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'existing-user' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should create club and admin user successfully', async () => {
      mockPrismaService.club.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const mockClub = { id: 'new-club-id', ...createDto };
      const mockUser = { id: 'new-user-id', email: createDto.adminEmail };

      mockPrismaService.club.create.mockResolvedValue(mockClub);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).toEqual({ club: mockClub, admin: { id: mockUser.id, email: mockUser.email } });

      // Verify implementation details (hashing, transaction)
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.club.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          subdomain: createDto.subdomain,
          email: createDto.email,
        },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: createDto.adminEmail,
          firstName: 'Admin',
          lastName: 'User',
          role: 'CLUB_ADMIN',
          clubId: 'new-club-id',
          passwordHash: 'hashed_password',
        }),
      });
    });
  });

  describe('remove', () => {
    it('should soft delete club and related entities', async () => {
      const clubId = 'club-1';
      // Mock transaction execution
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrismaService.$transaction.mockImplementation(async (arg: any) => {
        if (typeof arg === 'function') {
          return arg(mockPrismaService);
        }
        return Promise.all(arg);
      });

      // Add updateMany mocks
      mockPrismaService.user.updateMany = jest.fn();
      mockPrismaService.player = { ...mockPrismaService.player, updateMany: jest.fn() };
      mockPrismaService.club.update = jest.fn();
      // Mock payment if needed, though it wasn't in original mockPrismaService
      mockPrismaService.payment = { updateMany: jest.fn() };
      mockPrismaService.team = { updateMany: jest.fn() };

      await service.remove(clubId);

      expect(mockPrismaService.club.update).toHaveBeenCalledWith({
        where: { id: clubId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { clubId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.player.updateMany).toHaveBeenCalledWith({
        where: { clubId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.payment.updateMany).toHaveBeenCalledWith({
        where: { clubId },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
