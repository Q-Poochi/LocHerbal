import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class BlogPostService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.blogPost.findMany({
            where: { status: 'published' },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            orderBy: { publishedAt: 'desc' },
        });
    }

    async findById(id: string) {
        const post = await this.prisma.blogPost.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
        if (!post) {
            throw new NotFoundException('Bài viết không tồn tại');
        }
        return post;
    }

    async findBySlug(slug: string) {
        const post = await this.prisma.blogPost.findUnique({
            where: { slug },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
        if (!post) {
            throw new NotFoundException('Bài viết không tồn tại');
        }
        return post;
    }

    async create(data: {
        title: string;
        slug: string;
        content: string;
        thumbnailUrl?: string;
        authorId: string;
        status?: string;
        publishedAt?: Date;
    }) {
        return this.prisma.blogPost.create({
            data: {
                title: data.title,
                slug: data.slug,
                content: data.content,
                thumbnailUrl: data.thumbnailUrl,
                authorId: data.authorId,
                status: data.status || 'draft',
                publishedAt: data.publishedAt,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
    }

    async update(id: string, data: {
        title?: string;
        slug?: string;
        content?: string;
        thumbnailUrl?: string;
        status?: string;
        publishedAt?: Date;
    }) {
        const post = await this.prisma.blogPost.update({
            where: { id },
            data,
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
        if (!post) {
            throw new NotFoundException('Bài viết không tồn tại');
        }
        return post;
    }

    async remove(id: string) {
        return this.prisma.blogPost.delete({
            where: { id },
        });
    }
}