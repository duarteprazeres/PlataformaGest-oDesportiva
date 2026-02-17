import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAbsenceNoticeDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Athlete ID' })
  @IsUUID()
  athleteId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Player ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Training ID' })
  @IsUUID()
  trainingId!: string;

  @ApiProperty({ example: 'Sick leave', description: 'Reason for absence', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({
    example: 'ABSENCE',
    description: 'Type of notice',
    required: false,
    default: 'ABSENCE',
  })
  @IsString()
  @IsOptional()
  type?: string = 'ABSENCE'; // Default to ABSENCE, could be 'PRESENCE' confirmation if needed later
}
