import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateBannerDto {
    @IsString()
    title: string;

    // Dùng IsString như Product DTO (không IsUrl) vì upload nội bộ trả về localhost URL
    @IsString()
    imageUrl: string;

    @IsString()
    @IsOptional()
    linkUrl?: string;

    @IsString()
    position: string;

    @IsNumber()
    @IsOptional()
    sortOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateBannerDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    linkUrl?: string;

    @IsString()
    @IsOptional()
    position?: string;

    @IsNumber()
    @IsOptional()
    sortOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}