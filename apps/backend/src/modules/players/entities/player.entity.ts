import { ApiProperty } from '@nestjs/swagger';
import { PlayerStatus, MedicalStatus } from '@prisma/client';

export class PlayerEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Cristiano' })
  firstName!: string;

  @ApiProperty({ example: 'Ronaldo' })
  lastName!: string;

  @ApiProperty({ example: '2010-02-05T00:00:00.000Z' })
  birthDate!: Date;

  @ApiProperty({ example: 'Male', required: false })
  gender?: string | null;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  photoUrl?: string | null;

  @ApiProperty({ example: 7, required: false })
  jerseyNumber?: number | null;

  @ApiProperty({ enum: PlayerStatus, example: PlayerStatus.ACTIVE })
  status!: PlayerStatus;

  @ApiProperty({ enum: MedicalStatus, example: MedicalStatus.FIT })
  medicalStatus!: MedicalStatus;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Parent ID' })
  parentId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Team ID',
    required: false,
  })
  currentTeamId?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
