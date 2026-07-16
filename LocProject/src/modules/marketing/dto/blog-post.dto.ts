import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateBlogPostDto {
    @IsString()
    title: string;

    @IsString()
    slug: string;

    @IsString()
    content: string;

    @IsUrl()
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

    @IsUrl()
    @IsOptional()
    thumbnailUrl?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    publishedAt?: Date;
}