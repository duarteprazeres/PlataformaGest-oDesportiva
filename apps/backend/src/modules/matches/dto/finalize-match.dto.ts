import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class FinalizeMatchDto {
    @IsEnum(['WIN', 'DRAW', 'LOSS'], { message: 'Result must be WIN, DRAW, or LOSS' })
    result!: 'WIN' | 'DRAW' | 'LOSS';

    @IsNumber()
    goalsFor!: number;

    @IsNumber()
    goalsAgainst!: number;

    @IsOptional()
    @IsString()
    notes?: string;
}
