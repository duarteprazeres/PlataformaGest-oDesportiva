import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMatchDto {
    @IsEnum(['SCHEDULED', 'WIN', 'DRAW', 'LOSS'])
    @IsOptional()
    result?: 'SCHEDULED' | 'WIN' | 'DRAW' | 'LOSS';

    @IsNumber()
    @IsOptional()
    goalsFor?: number;

    @IsNumber()
    @IsOptional()
    goalsAgainst?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
