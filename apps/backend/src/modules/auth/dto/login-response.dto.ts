import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';

export class LoginResponseDto {
  @ApiProperty({
    description: 'The user information',
    type: UserEntity,
  })
  user!: UserEntity;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The JWT access token',
  })
  access_token!: string;
}
