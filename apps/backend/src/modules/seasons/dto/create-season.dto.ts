import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSeasonDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
