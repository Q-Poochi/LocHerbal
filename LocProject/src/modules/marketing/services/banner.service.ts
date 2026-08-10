import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Banner } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class BannerService {
    constructor(private readonly prisma: PrismaService) { }

    // ⚠️ 2 luồng RIÊNG BIỆT, 2 hàm riêng — không gộp 'hero' và 'home' vào chung 1 danh sách.

    /**
     * Hero banner — CHỈ position='hero', CHỈ trả về DUY NHẤT 1 record (hoặc null),
     * KHÔNG BAO GIỜ trả mảng. Đây là ảnh tĩnh thay icon chày cối trong khối Hero.
     */
    async getHeroBanner(): Promise<Banner | null> {
        return this.prisma.banner.findFirst({
            where: { position: 'hero', isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        // CHỈ 1 record — không findMany, không slice. Nếu null → frontend về fallback icon.
    }

    /**
     * Carousel banners — CHỈ position='home', trả mảng nhiều banner.
     * TUYỆT ĐỐI KHÔNG đụng tới position='hero'.
     */
    async getCarouselBanners(): Promise<Banner[]> {
        return this.prisma.banner.findMany({
            where: { position: 'home', isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        // CHỈ lấy 'home' — không query lẫn 'hero' vào.
    }

    /**
     * Admin upsert hero banner — CHỈ 1 bản ghi position='hero' tồn tại.
     * Có rồi thì UPDATE, chưa có thì CREATE — không bao giờ tạo thêm bản ghi thứ 2.
     */
    async upsertHeroBanner(data: {
        title: string;
        imageUrl: string;
        linkUrl?: string;
        isActive?: boolean;
    }) {
        const existing = await this.prisma.banner.findFirst({
            where: { position: 'hero' },
        });
        if (existing) {
            return this.prisma.banner.update({
                where: { id: existing.id },
                data: { ...data, position: 'hero' },
            });
        }
        return this.prisma.banner.create({
            data: {
                title: data.title,
                imageUrl: data.imageUrl,
                linkUrl: data.linkUrl,
                position: 'hero',
                sortOrder: 0,
                isActive: data.isActive ?? true,
            },
        });
    }

    /**
     * Admin xoá hero banner — khối Hero trở về fallback icon chày cối.
     */
    async removeHeroBanner() {
        return this.prisma.banner.deleteMany({
            where: { position: 'hero' },
        });
    }

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