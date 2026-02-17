import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'The new password for the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
