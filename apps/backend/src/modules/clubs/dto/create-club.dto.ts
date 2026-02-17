import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateClubDto {
  @ApiProperty({
    example: 'Academica de Coimbra',
    description: 'The name of the club',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'academica',
    description: 'The subdomain for the club (unique)',
  })
  @IsString()
  @IsNotEmpty()
  subdomain!: string;

  @ApiProperty({
    example: 'contact@academica.pt',
    description: 'The contact email for the club',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Admin User',
    description: 'The name of the initial admin user',
  })
  @IsString()
  @IsNotEmpty()
  adminName!: string;

  @ApiProperty({
    example: 'admin@academica.pt',
    description: 'The email of the initial admin user',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail!: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'The password for the initial admin user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  adminPassword!: string;
}
