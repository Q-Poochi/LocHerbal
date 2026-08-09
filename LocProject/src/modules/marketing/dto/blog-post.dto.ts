import { IsString, IsOptional } from 'class-validator';

export class CreateBlogPostDto {
    @IsString()
    title: string;

    @IsString()
    slug: string;

    @IsString()
    content: string;

    // Dùng IsString như Product DTO (không IsUrl) vì upload nội bộ trả về localhost URL
    @IsString()
    @IsOptional()
    thumbnailUrl?: string;

    @IsString()
    authorId: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    publishedAt?: Date;
}

export class UpdateBlogPostDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    thumbnailUrl?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    publishedAt?: Date;
}