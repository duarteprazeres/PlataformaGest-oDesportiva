// apps/backend/src/clubs/dto/create-club.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsNotEmpty, IsString, MinLength,
  IsOptional, IsIn
} from 'class-validator';

export class CreateClubDto {
  // --- Club Core ---
  @ApiProperty({ example: 'Academica de Coimbra' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'academica' })
  @IsString() @IsNotEmpty()
  subdomain!: string;

  @ApiProperty({ example: 'contact@academica.pt' })
  @IsEmail() @IsNotEmpty()
  email!: string;

  // --- Club Extra ---
  @ApiPropertyOptional({ example: '+351 239 000 000' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Rua do Estádio, 1' })
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Coimbra' })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '3000-001' })
  @IsOptional() @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Portugal' })
  @IsOptional() @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '500123456' })
  @IsOptional() @IsString()
  taxId?: string;

  // --- Subscription ---
  @ApiPropertyOptional({ example: 'FREE', enum: ['FREE', 'PRO', 'PREMIUM'] })
  @IsOptional()
  @IsIn(['FREE', 'PRO', 'PREMIUM'])
  subscriptionPlan?: string;

  // --- Admin Account ---
  @ApiProperty({ example: 'Admin User' })
  @IsString() @IsNotEmpty()
  adminName!: string;

  @ApiProperty({ example: 'admin@academica.pt' })
  @IsEmail() @IsNotEmpty()
  adminEmail!: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString() @IsNotEmpty() @MinLength(6)
  adminPassword!: string;
}
