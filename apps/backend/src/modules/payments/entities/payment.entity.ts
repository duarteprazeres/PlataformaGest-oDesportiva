import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus, PaymentType, PaymentMethod } from '@prisma/client';

export class PaymentEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Club ID' })
  clubId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Player ID' })
  playerId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Payer ID' })
  payerId!: string;

  @ApiProperty({ example: 50.0 })
  amount!: number;

  @ApiProperty({ enum: PaymentType, example: PaymentType.MONTHLY_FEE })
  paymentType!: PaymentType;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z' })
  dueDate!: Date;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z', required: false })
  paidDate?: Date | null;

  @ApiProperty({ example: 'February Monthly Fee', required: false })
  description?: string | null;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER, required: false })
  paymentMethod?: PaymentMethod | null;

  @ApiProperty({ example: 'https://example.com/receipt.pdf', required: false })
  receiptUrl?: string | null;

  @ApiProperty({ example: 'stripe_payment_intent_id', required: false })
  transactionId?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
