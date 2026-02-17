import { IsString, IsNumber, IsEnum, IsUUID, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType, PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Player ID' })
  @IsUUID()
  playerId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Payer User ID' })
  @IsUUID()
  payerId!: string;

  @ApiProperty({ example: 50.0, description: 'Amount' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: PaymentType, example: PaymentType.MONTHLY_FEE, description: 'Payment Type' })
  @IsEnum(PaymentType)
  paymentType!: PaymentType;

  @ApiProperty({ example: '2024-02-01', description: 'Due Date' })
  @IsDateString()
  dueDate!: string | Date;

  @ApiProperty({ example: 'February Monthly Fee', description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
    description: 'Payment Method',
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
