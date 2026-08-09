import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class BannerService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Danh sách CHỈ banner active — dùng cho storefront (homepage carousel).
     */
    async findAll(position?: string) {
        const where = position ? { position, isActive: true } : { isActive: true };
        return this.prisma.banner.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
        });
    }

    /**
     * Danh sách TẤT CẢ banner (kể cả inactive) — dùng cho admin để quản lý.
     */
    async findAllAdmin(position?: string) {
        const where = position ? { position } : {};
        return this.prisma.banner.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
        });
    }

    async findById(id: string) {
        const banner = await this.prisma.banner.findUnique({
            where: { id },
        });
        if (!banner) {
            throw new NotFoundException('Banner không tồn tại');
        }
        return banner;
    }

    async create(data: {
        title: string;
        imageUrl: string;
        linkUrl?: string;
        position: string;
        sortOrder?: number;
        isActive?: boolean;
    }) {
        return this.prisma.banner.create({
            data: {
                title: data.title,
                imageUrl: data.imageUrl,
                linkUrl: data.linkUrl,
                position: data.position,
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
            },
        });
    }

    async update(id: string, data: {
        title?: string;
        imageUrl?: string;
        linkUrl?: string;
        position?: string;
        sortOrder?: number;
        isActive?: boolean;
    }) {
        const banner = await this.prisma.banner.update({
            where: { id },
            data,
        });
        if (!banner) {
            throw new NotFoundException('Banner không tồn tại');
        }
        return banner;
    }

    async remove(id: string) {
        return this.prisma.banner.delete({
            where: { id },
        });
    }
}