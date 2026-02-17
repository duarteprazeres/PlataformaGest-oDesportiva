import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatchDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Team ID' })
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  @ApiProperty({ example: 'FC Porto Sub-15', description: 'Opponent Name' })
  @IsString()
  @IsNotEmpty()
  opponentName!: string;

  @ApiProperty({ example: 'Campeonato Nacional', description: 'Competition Name', required: false })
  @IsString()
  @IsOptional()
  competition?: string;

  @ApiProperty({ example: '2024-02-10', description: 'Match Date (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  matchDate!: string; // ISO date string

  @ApiProperty({ example: '15:00', description: 'Match Time (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  matchTime?: string; // HH:mm format

  @ApiProperty({ example: 'Estádio do Dragão', description: 'Location' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: true, description: 'Is match at home?', required: false })
  @IsBoolean()
  @IsOptional()
  isHomeMatch!: boolean;
}
