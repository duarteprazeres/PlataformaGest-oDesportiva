import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCallupStatsDto {
    @IsBoolean()
    played: boolean;

    @IsNumber()
    @Min(0)
    minutesPlayed: number;

    @IsNumber()
    @Min(0)
    goalsScored: number;

    @IsNumber()
    @Min(0)
    yellowCards: number;

    @IsBoolean()
    redCard: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(10)
    coachRating?: number; // 0-10

    @IsString()
    @IsOptional()
    notes?: string;
}
