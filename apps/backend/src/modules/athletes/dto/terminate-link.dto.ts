import { IsString, IsNotEmpty, IsOptional, IsUrl, IsEmail, IsBoolean } from 'class-validator';

export class TerminateLinkDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsUrl()
  @IsOptional()
  withdrawalLetterUrl?: string;

  @IsEmail()
  @IsOptional()
  destinationClubEmail?: string;

  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;
}
