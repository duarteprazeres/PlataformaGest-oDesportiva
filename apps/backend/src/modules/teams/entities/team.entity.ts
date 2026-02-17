import { ApiProperty } from '@nestjs/swagger';

export class TeamEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Under-15 A' })
  name!: string;

  @ApiProperty({ example: 'Junior', required: false })
  category?: string | null;

  @ApiProperty({ example: 'Male', required: false })
  gender?: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Club ID' })
  clubId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Season ID' })
  seasonId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Head Coach ID',
    required: false,
  })
  headCoachId?: string | null;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Assistant Coach ID',
    required: false,
  })
  assistantCoachId?: string | null;

  @ApiProperty({ example: 'Main competition team', required: false })
  description?: string | null;

  @ApiProperty({ example: 'https://example.com/team.jpg', required: false })
  teamPhotoUrl?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
