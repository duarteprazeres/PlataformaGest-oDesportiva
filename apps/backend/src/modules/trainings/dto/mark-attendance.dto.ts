import { IsEnum, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class PlayerAttendanceDto {
    @IsString()
    playerId: string;

    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsOptional()
    @IsString()
    justification?: string;
}

export class MarkAttendanceDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlayerAttendanceDto)
    attendance: PlayerAttendanceDto[];
}
