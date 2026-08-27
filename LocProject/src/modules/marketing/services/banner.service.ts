import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Banner } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { clearCacheByPrefix } from '../../../shared/cache/cache.util';

@Injectable()
export class BannerService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: any,
    ) { }

    private readonly inflight = new Map<string, Promise<any>>();

    private async singleFlightCache<T>(cacheKey: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached !== undefined && cached !== null) {
            return cached as T;
        }
        const existing = this.inflight.get(cacheKey);
        if (existing) {
            return existing as Promise<T>;
        }
        const p = (async () => {
            const result = await loader();
            try {
                await this.cacheManager.set(cacheKey, result, ttlMs);
            } catch {
                // cache write failure must not break the response
            }
            return result;
        })();
        this.inflight.set(cacheKey, p);
        try {
            return await p;
        } finally {
            if (this.inflight.get(cacheKey) === p) {
                this.inflight.delete(cacheKey);
            }
        }
    }

    private async clearBannerCache(): Promise<void> {
        try {
            await clearCacheByPrefix(this.cacheManager, 'marketing:banner:');
        } catch {
            // cache invalidation failure must not break the write path
        }
    }

    async getHeroBanner(): Promise<Banner | null> {
        return this.singleFlightCache('marketing:banner:hero', 3_600_000, () =>
            this.prisma.banner.findFirst({
                where: { position: 'hero', isActive: true },
                orderBy: { sortOrder: 'asc' },
            }),
        );
    }

    async getCarouselBanners(): Promise<Banner[]> {
        return this.singleFlightCache('marketing:banner:carousel', 3_600_000, () =>
            this.prisma.banner.findMany({
                where: { position: 'home', isActive: true },
                orderBy: { sortOrder: 'asc' },
            }),
        );
    }

    async findAll(position?: string): Promise<Banner[]> {
        const cacheKey = `marketing:banner:list:${position || 'all'}`;
        return this.singleFlightCache(cacheKey, 1_800_000, () => {
            const where = position ? { position, isActive: true } : { isActive: true };
            return this.prisma.banner.findMany({
                where,
                orderBy: { sortOrder: 'asc' },
            });
        });
    }

    async upsertHeroBanner(data: {
        title: string;
        imageUrl: string;
        linkUrl?: string;
        isActive?: boolean;
    }) {
        const existing = await this.prisma.banner.findFirst({
            where: { position: 'hero' },
        });
        const result = existing
            ? await this.prisma.banner.update({
                  where: { id: existing.id },
                  data: { ...data, position: 'hero' },
              })
            : await this.prisma.banner.create({
                  data: {
                      title: data.title,
                      imageUrl: data.imageUrl,
                      linkUrl: data.linkUrl,
                      position: 'hero',
                      sortOrder: 0,
                      isActive: data.isActive ?? true,
                  },
              });
        await this.clearBannerCache();
        return result;
    }

    async removeHeroBanner() {
        const result = await this.prisma.banner.deleteMany({
            where: { position: 'hero' },
        });
        await this.clearBannerCache();
        return result;
    }

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
            throw new NotFoundException('Banner khong ton tai');
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
        const result = await this.prisma.banner.create({
            data: {
                title: data.title,
                imageUrl: data.imageUrl,
                linkUrl: data.linkUrl,
                position: data.position,
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
            },
        });
        await this.clearBannerCache();
        return result;
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
            throw new NotFoundException('Banner khong ton tai');
        }
        await this.clearBannerCache();
        return banner;
    }

    async remove(id: string) {
        const result = await this.prisma.banner.delete({
            where: { id },
        });
        await this.clearBannerCache();
        return result;
    }
}