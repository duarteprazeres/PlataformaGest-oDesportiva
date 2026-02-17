import { ApiProperty } from '@nestjs/swagger';

export class MatchEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Team ID' })
  teamId!: string;

  @ApiProperty({ example: 'FC Porto Sub-15', description: 'Opponent Name' })
  opponentName!: string;

  @ApiProperty({ example: 'Campeonato Nacional', description: 'Competition Name', required: false })
  competition?: string | null;

  @ApiProperty({ example: '2024-02-10T15:00:00.000Z', description: 'Match Date' })
  matchDate!: Date;

  @ApiProperty({ example: 'Estádio do Dragão', description: 'Location' })
  location!: string;

  @ApiProperty({ example: true, description: 'Is match at home?' })
  isHomeMatch!: boolean;

  @ApiProperty({ example: 'SCHEDULED', description: 'Match Status' })
  status!: string;

  @ApiProperty({ example: 'WIN', description: 'Match Result', required: false })
  result?: string | null;

  @ApiProperty({ example: 3, description: 'Goals Scored', required: false })
  goalsFor?: number | null;

  @ApiProperty({ example: 1, description: 'Goals Conceded', required: false })
  goalsAgainst?: number | null;

  @ApiProperty({ example: 'Good performance', description: 'Notes', required: false })
  notes?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
