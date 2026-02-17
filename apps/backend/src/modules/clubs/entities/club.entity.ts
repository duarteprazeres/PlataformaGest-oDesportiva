import { ApiProperty } from '@nestjs/swagger';

export class ClubEntity {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the club',
  })
  id!: string;

  @ApiProperty({
    example: 'Academica de Coimbra',
    description: 'The name of the club',
  })
  name!: string;

  @ApiProperty({
    example: 'academica',
    description: 'The subdomain of the club',
  })
  subdomain!: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL to the club logo',
    required: false,
  })
  logoUrl?: string | null;

  @ApiProperty({
    example: 'contact@academica.pt',
    description: 'Contact email',
  })
  email!: string;

  @ApiProperty({
    example: '+351239123456',
    description: 'Phone number',
    required: false,
  })
  phone?: string | null;

  @ApiProperty({
    example: 'FREE',
    description: 'Subscription plan',
  })
  subscriptionPlan!: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Subscription status',
  })
  subscriptionStatus!: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation date',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update date',
  })
  updatedAt!: Date;
}
