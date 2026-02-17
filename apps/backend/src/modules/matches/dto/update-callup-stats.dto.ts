import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCallupStatsDto {
  @ApiProperty({ example: true, description: 'Did the player play?' })
  @IsBoolean()
  played!: boolean;

  @ApiProperty({ example: 90, description: 'Minutes played' })
  @IsNumber()
  @Min(0)
  minutesPlayed!: number;

  @ApiProperty({ example: 1, description: 'Goals scored' })
  @IsNumber()
  @Min(0)
  goalsScored!: number;

  @ApiProperty({ example: 0, description: 'Yellow cards' })
  @IsNumber()
  @Min(0)
  yellowCards!: number;

  @ApiProperty({ example: false, description: 'Red card?' })
  @IsBoolean()
  redCard!: boolean;

  @ApiProperty({ example: 8, description: 'Coach rating (0-10)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  coachRating?: number; // 0-10

  @ApiProperty({ example: 'Great impact', description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
