import { ApiProperty } from '@nestjs/swagger';

export class TrainingEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Team ID' })
  teamId!: string;

  @ApiProperty({ example: '2024-01-20T18:00:00.000Z' })
  startTime!: Date;

  @ApiProperty({ example: '2024-01-20T19:30:00.000Z' })
  endTime!: Date;

  @ApiProperty({ example: 'Training Ground A' })
  location!: string;

  @ApiProperty({ example: 'upcoming', description: 'Training status (upcoming, history, etc.)' })
  status!: string;

  @ApiProperty({ example: 'Focus on passing', required: false })
  notes?: string | null;

  @ApiProperty({ example: 'Improve ball control', required: false })
  objectives?: string | null;

  @ApiProperty({ example: 'https://example.com/plan.pdf', required: false })
  planFileUrl?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
