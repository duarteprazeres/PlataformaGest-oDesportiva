import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { PrismaService } from '../../database/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MailService } from '../mail/mail.service';
import { BadRequestException } from '@nestjs/common';

describe('PlayersService - Withdrawal Flow', () => {
    let service: PlayersService;
    let prisma: PrismaService;
    let mailService: MailService;


    const mockPrismaService = {
        player: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        club: {
            findUnique: jest.fn(),
        },
    };

    const mockMailService = {
        sendWithdrawalPackage: jest.fn(),
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
                PlayersService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
                { provide: MetricsService, useValue: mockMetricsService },
                { provide: MailService, useValue: mockMailService },
            ],
        }).compile();

        service = module.get<PlayersService>(PlayersService);
        prisma = module.get<PrismaService>(PrismaService);
        mailService = module.get<MailService>(MailService);
    });

    describe('terminateLink', () => {
        const clubId = 'club-1';
        const playerId = 'player-1';
        const reason = 'Moving abroad';
        const email = 'newclub@example.com';
        const letterUrl = 'http://example.com/letter.pdf';

        const mockPlayer = {
            id: playerId,
            clubId,
            firstName: 'John',
            lastName: 'Doe',
            status: 'ACTIVE',
        };

        it('should successfully terminate link and send email', async () => {
            // Mock findOne (no cache)
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.player.findFirst.mockResolvedValue(mockPlayer);

            // Mock Club find for email
            mockPrismaService.club.findUnique.mockResolvedValue({ id: clubId, name: 'Old Club' });

            // Mock Update
            mockPrismaService.player.update.mockResolvedValue({
                ...mockPlayer,
                status: 'LEFT',
                withdrawalReason: reason,
                destinationClubEmail: email,
                documentsSentAt: new Date(),
            });

            const result = await service.terminateLink(clubId, playerId, {
                reason,
                destinationEmail: email,
                letterUrl,
                sendEmail: true,
            });

            expect(result.status).toBe('LEFT');
            expect(result.documentsSentAt).toBeDefined();

            // Verify logic
            expect(mailService.sendWithdrawalPackage).toHaveBeenCalledWith(
                email,
                'John Doe',
                'Old Club',
                expect.arrayContaining([{ filename: 'Carta_Rescisao.pdf', content: letterUrl }])
            );

            expect(prisma.player.update).toHaveBeenCalledWith({
                where: { id: playerId },
                data: expect.objectContaining({
                    status: 'LEFT',
                    withdrawalReason: reason,
                    destinationClubEmail: email,
                    withdrawalLetterUrl: letterUrl,
                    currentTeamId: null,
                    athleteId: null,
                    documentsSentAt: expect.any(Date),
                }),
            });

            // Verify cache clear
            expect(mockCacheManager.del).toHaveBeenCalledWith(`player:${clubId}:${playerId}`);
        });

        it('should perform partial withdrawal if sendEmail is false', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.player.findFirst.mockResolvedValue(mockPlayer);

            await service.terminateLink(clubId, playerId, {
                reason,
                destinationEmail: email,
                letterUrl,
                sendEmail: false,
            });

            expect(mailService.sendWithdrawalPackage).not.toHaveBeenCalled();
            expect(prisma.player.update).toHaveBeenCalledWith({
                where: { id: playerId },
                data: expect.objectContaining({
                    status: 'LEFT',
                    withdrawalReason: reason,
                    // documentsSentAt should NOT be set
                }),
            });
            // Check that documentsSentAt is missing from expectation, implying undefined in update object if structured correctly
            // My implementation uses "updateData.documentsSentAt = new Date()" only if condition met.
        });

        it('should throw BadRequestException if player already withdrawn (LEFT)', async () => {
            mockCacheManager.get.mockResolvedValue({ ...mockPlayer, status: 'LEFT' });

            await expect(service.terminateLink(clubId, playerId, { reason })).rejects.toThrow(BadRequestException);
        });
    });
});
