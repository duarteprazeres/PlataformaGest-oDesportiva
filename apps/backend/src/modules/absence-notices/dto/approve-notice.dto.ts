import { IsOptional, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class InjuryDataDto {
  @ApiProperty({ example: 'Sprained Ankle' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'MILD', enum: ['MILD', 'MODERATE', 'SEVERE'] })
  @IsString()
  severity!: 'MILD' | 'MODERATE' | 'SEVERE';

  @ApiProperty({ example: 'Happened during warm-up', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  estimatedRecoveryDays?: number;
}

export class ApproveNoticeDto {
  @ApiProperty({ example: 'Approved, get well soon', required: false })
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  createInjury?: boolean;

  @ApiProperty({ type: InjuryDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => InjuryDataDto)
  injuryData?: InjuryDataDto;
}
