import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class BlogPostService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Danh sách CHỈ bài đã publish (hoặc draft nếu muốn xem) — dùng cho storefront.
     */
    async findAll(publishedOnly = true) {
        return this.prisma.blogPost.findMany({
            where: publishedOnly ? { status: 'published' } : {},
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

    /**
     * Danh sách TẤT CẢ bài (kể cả draft) — dùng cho admin quản lý.
     */
    async findAllAdmin() {
        return this.findAll(false);
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
        const status = (data.status || 'draft').toLowerCase();
        const publishedAt = status === 'published' ? (data.publishedAt ?? new Date()) : undefined;
        return this.prisma.blogPost.create({
            data: {
                title: data.title,
                slug: data.slug,
                content: data.content,
                thumbnailUrl: data.thumbnailUrl,
                authorId: data.authorId,
                status,
                publishedAt,
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
            data: {
                ...data,
                status: data.status ? data.status.toLowerCase() : undefined,
                publishedAt:
                    data.status === 'published'
                        ? (data.publishedAt ?? new Date())
                        : data.status !== undefined && data.status !== 'published'
                          ? null
                          : data.publishedAt,
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