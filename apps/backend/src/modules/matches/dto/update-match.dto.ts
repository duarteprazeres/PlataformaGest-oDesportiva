import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMatchDto {
  @ApiProperty({
    example: 'WIN',
    description: 'Match Result',
    required: false,
    enum: ['SCHEDULED', 'WIN', 'DRAW', 'LOSS'],
  })
  @IsEnum(['SCHEDULED', 'WIN', 'DRAW', 'LOSS'])
  @IsOptional()
  result?: 'SCHEDULED' | 'WIN' | 'DRAW' | 'LOSS';

  @ApiProperty({ example: 3, description: 'Goals Scored', required: false })
  @IsNumber()
  @IsOptional()
  goalsFor?: number;

  @ApiProperty({ example: 1, description: 'Goals Conceded', required: false })
  @IsNumber()
  @IsOptional()
  goalsAgainst?: number;

  @ApiProperty({ example: 'Good performance', description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
