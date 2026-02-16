import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { MedicalStatus } from '@prisma/client';

export class UpdateInjuryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}
