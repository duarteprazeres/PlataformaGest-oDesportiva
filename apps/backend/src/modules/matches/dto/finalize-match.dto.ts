import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FinalizeMatchDto {
  @ApiProperty({ example: 'WIN', description: 'Match Result', enum: ['WIN', 'DRAW', 'LOSS'] })
  @IsEnum(['WIN', 'DRAW', 'LOSS'], { message: 'Result must be WIN, DRAW, or LOSS' })
  result!: 'WIN' | 'DRAW' | 'LOSS';

  @ApiProperty({ example: 3, description: 'Goals Scored' })
  @IsNumber()
  goalsFor!: number;

  @ApiProperty({ example: 1, description: 'Goals Conceded' })
  @IsNumber()
  goalsAgainst!: number;

  @ApiProperty({ example: 'Final whistle analysis', description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
