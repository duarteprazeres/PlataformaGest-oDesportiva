import { IsOptional, IsString } from 'class-validator';

export class DismissNoticeDto {
    @IsOptional()
    @IsString()
    reviewNotes?: string;
}
