import { IsString, IsUrl, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateBannerDto {
    @IsString()
    title: string;

    @IsUrl()
    imageUrl: string;

    @IsUrl()
    @IsOptional()
    linkUrl?: string;

    @IsString()
    position: string;

    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class UpdateBannerDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @IsUrl()
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