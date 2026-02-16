import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateAbsenceNoticeDto {
    @IsUUID()
    athleteId: string;

    @IsOptional()
    @IsUUID()
    playerId?: string;

    @IsUUID()
    trainingId: string;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    type?: string = 'ABSENCE'; // Default to ABSENCE, could be 'PRESENCE' confirmation if needed later
}
