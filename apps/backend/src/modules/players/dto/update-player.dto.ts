import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { PlayerStatus } from '@prisma/client';

export class UpdatePlayerDto {
    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(99)
    jerseyNumber?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currentTeamId?: string;

    @ApiPropertyOptional({ enum: PlayerStatus })
    @IsOptional()
    @IsEnum(PlayerStatus)
    status?: PlayerStatus;
}
