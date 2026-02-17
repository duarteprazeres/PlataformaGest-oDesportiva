import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserEntity {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the user',
  })
  id!: string;

  @ApiProperty({
    example: 'coach@example.com',
    description: 'The email address of the user',
  })
  email!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.COACH,
    description: 'The role of the user within the system',
  })
  role!: UserRole;

  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
  })
  lastName!: string;

  @ApiProperty({
    example: '+351912345678',
    description: 'Phone number',
    required: false,
  })
  phone?: string | null;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL to the user avatar',
    required: false,
  })
  avatarUrl?: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether the user account is active',
  })
  isActive!: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the user was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the user was last updated',
  })
  updatedAt!: Date;
}
