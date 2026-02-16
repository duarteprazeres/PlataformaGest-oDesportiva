import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMatchDto {
    @IsString()
    @IsNotEmpty()
    teamId: string;

    @IsString()
    @IsNotEmpty()
    opponentName: string;

    @IsString()
    @IsOptional()
    competition?: string;

    @IsDateString()
    @IsNotEmpty()
    matchDate: string; // ISO date string

    @IsString()
    @IsOptional()
    matchTime?: string; // HH:mm format

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsBoolean()
    @IsOptional()
    isHomeMatch: boolean;
}
