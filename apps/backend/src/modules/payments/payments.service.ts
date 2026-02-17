import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentStatus, Prisma } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto, user: { clubId: string; id: string }) {
    // Validation: Amount cannot be negative (already checked by DTO usually, but double check business logic)
    if (createPaymentDto.amount < 0) {
      throw new BadRequestException('Amount cannot be negative');
    }

    // Validation: Player must belong to the same club
    const player = await this.prisma.player.findUnique({
      where: { id: createPaymentDto.playerId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    if (player.clubId !== user.clubId) {
      throw new ForbiddenException('Player belongs to another club');
    }

    return this.prisma.payment.create({
      data: {
        ...createPaymentDto,
        clubId: user.clubId,
        status: PaymentStatus.PENDING,
        // Assuming the user creating it is the "processor" or related to it,
        // schema says `payerId` is required and refers to `User`.
        // If the payer is the parent, we need that ID.
        // For now, let's assume `payerId` is passed in DTO or inferred.
        // Re-checking schema: payerId is required @relation("PayerPayments")
        // We need to resolve payerId. Often it's the player's parent.
        payerId: createPaymentDto.payerId, // We will add this to DTO
      },
    });
  }

  async findAll(clubId: string) {
    return this.prisma.payment.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, clubId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.clubId !== clubId) {
      throw new ForbiddenException('Access denied');
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, clubId: string) {
    const payment = await this.findOne(id, clubId);

    // State transitions validation
    if (updatePaymentDto.status) {
      if (
        payment.status === PaymentStatus.PAID &&
        updatePaymentDto.status === PaymentStatus.PENDING
      ) {
        throw new BadRequestException('Cannot change status from PAID to PENDING');
      }
      if (
        payment.status === PaymentStatus.CANCELLED &&
        updatePaymentDto.status === PaymentStatus.PAID
      ) {
        throw new BadRequestException('Cannot change status from CANCELLED to PAID');
      }
    }

    const data: Prisma.PaymentUpdateInput = { ...updatePaymentDto };

    if (updatePaymentDto.status === PaymentStatus.PAID && payment.status !== PaymentStatus.PAID) {
      data.paidAt = new Date();
    }

    if (
      updatePaymentDto.status === PaymentStatus.REFUNDED &&
      payment.status !== PaymentStatus.REFUNDED
    ) {
      // Logic for refund timestamp could go here if schema supports it, schema has 'refundedAt' ? No, schema has 'paidAt'.
      // Schema check: Wait, schema does NOT have `refundedAt`. It has `paidAt`.
      // It has `payment_status` enum with REFUNDED.
      // Let's stick to simple updates for now.
    }

    return this.prisma.payment.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, clubId: string) {
    const payment = await this.findOne(id, clubId);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot delete a PAID payment');
    }

    return this.prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async markAsOverdue(clubId: string) {
    const today = new Date();
    const result = await this.prisma.payment.updateMany({
      where: {
        clubId,
        status: PaymentStatus.PENDING,
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });
    return result;
  }

  async processWebhook(payload: {
    paymentId: string;
    status: 'PAID' | 'CANCELLED';
    transactionId?: string;
    signature: string;
  }) {
    // Verify signature (stub implementation)
    if (payload.signature !== 'valid-signature') {
      throw new BadRequestException('Invalid signature');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: payload.paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      // Idempotency: already paid
      return payment;
    }

    let newStatus: PaymentStatus = payment.status;
    const updateData: Prisma.PaymentUpdateInput = {};

    if (payload.status === 'PAID') {
      newStatus = PaymentStatus.PAID;
      updateData.paidAt = new Date();
      updateData.transactionId = payload.transactionId;
    } else if (payload.status === 'CANCELLED') {
      newStatus = PaymentStatus.CANCELLED;
    }

    return this.prisma.payment.update({
      where: { id: payload.paymentId },
      data: {
        status: newStatus,
        ...updateData,
      },
    });
  }
}
