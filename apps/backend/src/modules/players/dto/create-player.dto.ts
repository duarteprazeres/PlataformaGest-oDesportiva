import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlayerDto {
  @ApiProperty({ example: 'Cristiano', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Ronaldo', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '2010-02-05', description: 'Date of birth (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  birthDate!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Parent User ID' })
  @IsUUID()
  @IsNotEmpty()
  parentId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Current Team ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  currentTeamId?: string;

  @ApiProperty({ example: 'Male', description: 'Gender', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 7, description: 'Jersey number', required: false })
  @IsNumber()
  @IsOptional()
  jerseyNumber?: number;

  @ApiProperty({
    example: 'https://example.com/photo.jpg',
    description: 'Photo URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;
}
