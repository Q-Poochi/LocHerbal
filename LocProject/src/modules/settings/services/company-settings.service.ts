import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../../../shared/prisma/prisma.service';

const DEFAULT_SETTINGS_ID = 'company-default';
const CACHE_KEY = 'settings:company';
const CACHE_TTL = 3_600_000; // 1 hour

@Injectable()
export class CompanySettingsService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: any,
    ) { }

    /**
     * Lấy settings công ty — cached 1 giờ.
     * Đảm bảo luôn có 1 dòng (upsert default nếu chưa có).
     */
    async get() {
        const cached = await this.cacheManager.get(CACHE_KEY);
        if (cached) return cached;

        const existing = await this.prisma.companySettings.findFirst();
        const result = existing || await this.prisma.companySettings.create({
            data: {
                id: DEFAULT_SETTINGS_ID,
                companyName: 'LocHerbal',
            },
        });

        try {
            await this.cacheManager.set(CACHE_KEY, result, CACHE_TTL);
        } catch {
            // cache write failure must not break the response
        }
        return result;
    }

    async update(data: Partial<Record<keyof import('@prisma/client').CompanySettings, unknown>>) {
        const current = await this.get();
        const result = await this.prisma.companySettings.update({
            where: { id: current.id },
            data,
        });
        try {
            await this.cacheManager.del(CACHE_KEY);
        } catch {
            // cache invalidation failure must not break the write path
        }
        return result;
    }
}
