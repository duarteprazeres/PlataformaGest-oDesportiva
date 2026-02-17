import { IsEnum, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class PlayerAttendanceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Player ID' })
  @IsString()
  playerId!: string;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Attendance Status',
  })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiProperty({ example: 'Sick', description: 'Justification for absence', required: false })
  @IsOptional()
  @IsString()
  justification?: string;
}

export class MarkAttendanceDto {
  @ApiProperty({ type: [PlayerAttendanceDto], description: 'List of attendance records' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerAttendanceDto)
  attendance!: PlayerAttendanceDto[];
}
