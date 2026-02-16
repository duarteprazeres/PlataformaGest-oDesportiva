import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTrainingDto {
    @IsUUID()
    teamId: string;

    @IsDateString()
    scheduledDate: string; // YYYY-MM-DD

    @IsString()
    startTime: string; // HH:mm

    @IsString()
    endTime: string; // HH:mm

    @IsString()
    location: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    objectives?: string;

    // File is handled separately by Multer, but we can have a field for the URL if passed manually
    @IsString()
    @IsOptional()
    planFileUrl?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isRecurring?: boolean;

    @IsOptional()
    @IsString()
    frequency?: 'WEEKLY';

    @IsOptional()
    @IsString()
    recurrenceEndDate?: string;
}
