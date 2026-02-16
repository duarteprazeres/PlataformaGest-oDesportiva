import { IsString, IsOptional } from 'class-validator';

export class SearchAthleteDto {
    @IsString()
    @IsOptional()
    publicId?: string;

    @IsString()
    @IsOptional()
    citizenCard?: string;

    @IsString()
    @IsOptional()
    taxId?: string;
}
