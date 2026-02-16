import { IsEnum, IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { MedicalStatus } from '@prisma/client';

export class CreateInjuryDto {
    @IsUUID()
    playerId: string;

    @IsEnum(MedicalStatus)
    status: MedicalStatus;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    startDate: string;
}
