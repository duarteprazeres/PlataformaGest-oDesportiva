import { IsString, IsOptional, IsDateString } from 'class-validator';

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
