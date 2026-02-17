import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTrainingDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Team ID' })
  @IsUUID()
  teamId!: string;

  @ApiProperty({ example: '2024-01-20', description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  scheduledDate!: string; // YYYY-MM-DD

  @ApiProperty({ example: '18:00', description: 'Start Time (HH:mm)' })
  @IsString()
  startTime!: string; // HH:mm

  @ApiProperty({ example: '19:30', description: 'End Time (HH:mm)' })
  @IsString()
  endTime!: string; // HH:mm

  @ApiProperty({ example: 'Training Ground A', description: 'Location' })
  @IsString()
  location!: string;

  @ApiProperty({ example: 'Focus on passing', description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'Improve ball control', description: 'Objectives', required: false })
  @IsString()
  @IsOptional()
  objectives?: string;

  // File is handled separately by Multer, but we can have a field for the URL if passed manually
  @ApiProperty({
    example: 'https://example.com/plan.pdf',
    description: 'Plan File URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  planFileUrl?: string;

  @ApiProperty({ example: false, description: 'Is Recurring?', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isRecurring?: boolean;

  @ApiProperty({ example: 'WEEKLY', description: 'Frequency', required: false, enum: ['WEEKLY'] })
  @IsOptional()
  @IsString()
  frequency?: 'WEEKLY';

  @ApiProperty({
    example: '2024-06-01',
    description: 'Recurrence End Date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  recurrenceEndDate?: string;
}
