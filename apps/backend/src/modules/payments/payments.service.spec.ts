import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentStatus, PaymentType, PaymentMethod } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  // let prisma: PrismaService; // Removed unused variable

  const mockPrismaService = {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    player: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-uuid',
    clubId: 'club-uuid',
    role: 'CLUB_ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    // prisma = module.get<PrismaService>(PrismaService); // Removed
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      playerId: 'player-uuid',
      payerId: 'payer-uuid',
      amount: 50.0,
      paymentType: PaymentType.MONTHLY_FEE,
      dueDate: new Date('2026-03-01'),
      paymentMethod: PaymentMethod.MBWAY,
    };

    it('should create a payment successfully', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue({
        id: 'player-uuid',
        clubId: 'club-uuid',
      });

      mockPrismaService.payment.create.mockResolvedValue({
        id: 'payment-id',
        ...createDto,
        clubId: 'club-uuid',
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createDto, mockUser);

      expect(result).toBeDefined();
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.clubId).toBe('club-uuid');
      expect(mockPrismaService.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clubId: 'club-uuid',
          status: PaymentStatus.PENDING,
        }),
      });
    });

    it('should throw BadRequestException if amount is negative', async () => {
      await expect(service.create({ ...createDto, amount: -10 }, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if player does not exist', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if player belongs to another club', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue({
        id: 'player-uuid',
        clubId: 'other-club-uuid', // Different club
      });

      await expect(service.create(createDto, mockUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return an array of payments for the club', async () => {
      const payments = [
        { id: '1', clubId: 'club-uuid' },
        { id: '2', clubId: 'club-uuid' },
      ];
      mockPrismaService.payment.findMany.mockResolvedValue(payments);

      const result = await service.findAll('club-uuid');
      expect(result).toEqual(payments);
      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith({
        where: { clubId: 'club-uuid' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a payment if it belongs to the club', async () => {
      const mockPayment = { id: 'payment-id', clubId: 'club-uuid' };
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await service.findOne('payment-id', 'club-uuid');
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);
      await expect(service.findOne('payment-id', 'club-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if payment belongs to another club', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-id',
        clubId: 'other-club',
      });
      await expect(service.findOne('payment-id', 'club-uuid')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const mockPayment = {
      id: 'payment-id',
      clubId: 'club-uuid',
      status: PaymentStatus.PENDING,
    };

    it('should update status from PENDING to PAID and set paidAt', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      });

      const result = await service.update(
        'payment-id',
        { status: PaymentStatus.PAID },
        'club-uuid',
      );

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-id' },
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          paidAt: expect.any(Date),
        }),
      });
    });

    it('should throw BadRequestException when changing PAID to PENDING', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      });

      await expect(
        service.update('payment-id', { status: PaymentStatus.PENDING }, 'club-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when changing CANCELLED to PAID', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.CANCELLED,
      });

      await expect(
        service.update('payment-id', { status: PaymentStatus.PAID }, 'club-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should check for payment existence and ownership', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);
      await expect(service.update('payment-id', {}, 'club-uuid')).rejects.toThrow(
        NotFoundException,
      );

      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        clubId: 'other-club',
      });
      await expect(service.update('payment-id', {}, 'club-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markAsOverdue', () => {
    it('should mark past due pending payments as OVERDUE', async () => {
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAsOverdue('club-uuid');

      expect(result.count).toBe(5);
      expect(mockPrismaService.payment.updateMany).toHaveBeenCalledWith({
        where: {
          clubId: 'club-uuid',
          status: PaymentStatus.PENDING,
          dueDate: { lt: expect.any(Date) },
        },
        data: { status: PaymentStatus.OVERDUE },
      });
    });
  });

  describe('processWebhook', () => {
    const payload = {
      paymentId: 'payment-id',
      status: 'PAID' as const,
      transactionId: 'tx-123',
      signature: 'valid-signature',
    };

    it('should process a valid webhook and mark payment as PAID', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-id',
        status: PaymentStatus.PENDING,
      });

      mockPrismaService.payment.update.mockResolvedValue({
        id: 'payment-id',
        status: PaymentStatus.PAID,
      });

      await service.processWebhook(payload);

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-id' },
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          transactionId: 'tx-123',
          paidAt: expect.any(Date),
        }),
      });
    });

    it('should reject invalid signature', async () => {
      await expect(service.processWebhook({ ...payload, signature: 'invalid' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle non-existent payment', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);
      await expect(service.processWebhook(payload)).rejects.toThrow(NotFoundException);
    });

    it('should be idempotent (not update if already PAID)', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-id',
        status: PaymentStatus.PAID,
      });

      await service.processWebhook(payload);

      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a pending payment', async () => {
      const mockPayment = {
        id: 'payment-id',
        clubId: 'club-uuid',
        status: PaymentStatus.PENDING,
      };
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        deletedAt: new Date(),
      });

      await service.remove('payment-id', 'club-uuid');

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-id' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw BadRequestException if deleting PAID payment', async () => {
      const mockPayment = {
        id: 'payment-id',
        clubId: 'club-uuid',
        status: PaymentStatus.PAID,
      };
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(service.remove('payment-id', 'club-uuid')).rejects.toThrow(BadRequestException);
    });
  });
});
