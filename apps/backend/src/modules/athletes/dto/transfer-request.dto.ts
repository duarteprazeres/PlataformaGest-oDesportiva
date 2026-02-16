import { IsString, IsNotEmpty } from 'class-validator';

export class TransferRequestDto {
    @IsString()
    @IsNotEmpty()
    publicId: string;
}
