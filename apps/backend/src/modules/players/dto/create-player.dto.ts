import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, IsNumber } from 'class-validator';

export class CreatePlayerDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsDateString()
    @IsNotEmpty()
    birthDate: string;

    @IsUUID()
    @IsNotEmpty()
    parentId: string;

    @IsUUID()
    @IsOptional()
    currentTeamId?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsNumber()
    @IsOptional()
    jerseyNumber?: number;

    @IsString()
    @IsOptional()
    photoUrl?: string;
}
