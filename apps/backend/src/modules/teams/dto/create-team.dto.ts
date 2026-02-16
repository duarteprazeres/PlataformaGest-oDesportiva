import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTeamDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    seasonId: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    headCoachId?: string;

    @IsString()
    @IsOptional()
    assistantCoachId?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
