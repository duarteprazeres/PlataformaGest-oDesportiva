import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreatePassportDto {
    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @IsString()
    @IsNotEmpty()
    lastName!: string;

    @IsDateString()
    @IsNotEmpty()
    birthDate!: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    citizenCard?: string;

    @IsString()
    @IsOptional()
    taxId?: string;
}
