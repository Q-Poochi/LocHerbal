import { IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO riêng cho hero banner — CHỈ 1 bản ghi, không có danh sách.
 */
export class UpsertHeroBannerDto {
    @IsString()
    title: string;

    @IsString()
    imageUrl: string;

    @IsString()
    @IsOptional()
    linkUrl?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}