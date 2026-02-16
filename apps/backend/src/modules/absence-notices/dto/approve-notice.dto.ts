import { IsOptional, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class InjuryDataDto {
    @IsString()
    name!: string;

    @IsString()
    severity!: 'MILD' | 'MODERATE' | 'SEVERE';

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    estimatedRecoveryDays?: number;
}

export class ApproveNoticeDto {
    @IsOptional()
    @IsString()
    reviewNotes?: string;

    @IsOptional()
    @IsBoolean()
    createInjury?: boolean;

    @IsOptional()
    @ValidateNested()
    @Type(() => InjuryDataDto)
    injuryData?: InjuryDataDto;
}
