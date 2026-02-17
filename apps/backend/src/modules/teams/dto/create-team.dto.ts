import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Under-15 A', description: 'Team name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Season ID' })
  @IsString()
  @IsNotEmpty()
  seasonId!: string;

  @ApiProperty({ example: 'Junior', description: 'Team category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Male', description: 'Team gender', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Head Coach User ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  headCoachId?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Assistant Coach User ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  assistantCoachId?: string;

  @ApiProperty({ example: 'Main competition team', description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
