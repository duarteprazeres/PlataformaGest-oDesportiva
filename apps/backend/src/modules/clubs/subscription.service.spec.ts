import { Test, TestingModule } from '@nestjs/testing';
import { ClubsService } from './clubs.service';
import { PrismaService } from '../../database/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';

describe('ClubsService - Subscription Management', () => {
    let service: ClubsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        club: {
            update: jest.fn(),
        },
        player: {
            count: jest.fn(),
        },
        team: {
            count: jest.fn(),
        },
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockMetricsService = {
        incrementCacheHit: jest.fn(),
        incrementCacheMiss: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClubsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
                { provide: MetricsService, useValue: mockMetricsService },
            ],
        }).compile();

        service = module.get<ClubsService>(ClubsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    describe('updateSubscription', () => {
        const clubId = 'club-1';

        it('should allow upgrade to PRO without checking limits', async () => {
            mockPrismaService.club.update.mockResolvedValue({ id: clubId, subscriptionPlan: 'PRO' });

            const result = await service.updateSubscription(clubId, 'PRO');

            expect(result.subscriptionPlan).toBe('PRO');
            expect(prisma.player.count).not.toHaveBeenCalled(); // Should assume Infinity limit doesn't need check? 
            // Implementation: if (limits.players !== Infinity ...). PRO has Infinity. So yes.
        });

        it('should allow downgrade to FREE if within limits', async () => {
            mockPrismaService.player.count.mockResolvedValue(10); // Limit 20
            mockPrismaService.team.count.mockResolvedValue(0);   // Limit 1
            mockPrismaService.club.update.mockResolvedValue({ id: clubId, subscriptionPlan: 'FREE' });

            const result = await service.updateSubscription(clubId, 'FREE');

            expect(result.subscriptionPlan).toBe('FREE');
            expect(prisma.player.count).toHaveBeenCalledWith({ where: { clubId } });
        });

        it('should fail downgrade to FREE if exceeds player limit', async () => {
            mockPrismaService.player.count.mockResolvedValue(25); // Limit 20
            mockPrismaService.team.count.mockResolvedValue(1);

            await expect(service.updateSubscription(clubId, 'FREE'))
                .rejects.toThrow(BadRequestException);

            expect(prisma.club.update).not.toHaveBeenCalled();
        });

        it('should fail downgrade to FREE if exceeds team limit', async () => {
            mockPrismaService.player.count.mockResolvedValue(10);
            mockPrismaService.team.count.mockResolvedValue(2); // Limit 1

            await expect(service.updateSubscription(clubId, 'FREE'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for invalid plan', async () => {
            await expect(service.updateSubscription(clubId, 'INVALID')).rejects.toThrow(BadRequestException);
        });
    });
});
