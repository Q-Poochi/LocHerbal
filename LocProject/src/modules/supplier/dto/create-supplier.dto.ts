import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateSupplierDto {
    @IsString()
    @MinLength(1)
    name: string;

    @IsOptional()
    @IsString()
    contactPerson?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}