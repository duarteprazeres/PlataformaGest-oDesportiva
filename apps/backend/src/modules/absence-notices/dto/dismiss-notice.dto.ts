import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DismissNoticeDto {
  @ApiProperty({ example: 'Duplicate notice', required: false })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
