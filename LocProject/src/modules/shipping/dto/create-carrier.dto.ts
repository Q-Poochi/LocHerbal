import { IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateCarrierDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsOptional()
    apiConfig?: any;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}