import { ApiProperty } from '@nestjs/swagger';
import { AbsenceNoticeStatus } from '@prisma/client';

export class AbsenceNoticeEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Athlete ID' })
  athleteId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Training ID' })
  trainingId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Reporter ID (Parent)',
  })
  reporterId!: string;

  @ApiProperty({ example: 'Sick leave', description: 'Reason' })
  reason!: string;

  @ApiProperty({ enum: AbsenceNoticeStatus, example: AbsenceNoticeStatus.PENDING })
  status!: AbsenceNoticeStatus;

  @ApiProperty({ example: 'Approved', required: false })
  reviewNotes?: string | null;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Reviewer ID',
    required: false,
  })
  reviewerId?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
