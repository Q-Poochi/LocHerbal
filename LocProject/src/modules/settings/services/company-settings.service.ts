import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

const DEFAULT_SETTINGS_ID = 'company-default';

@Injectable()
export class CompanySettingsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Lấy settings công ty — đảm bảo luôn có 1 dòng (upsert default nếu chưa có).
     */
    async get() {
        const existing = await this.prisma.companySettings.findFirst();
        if (existing) return existing;
        return this.prisma.companySettings.create({
            data: {
                id: DEFAULT_SETTINGS_ID,
                companyName: 'LocHerbal',
            },
        });
    }

    async update(data: Partial<Record<keyof import('@prisma/client').CompanySettings, unknown>>) {
        const current = await this.get();
        return this.prisma.companySettings.update({
            where: { id: current.id },
            data,
        });
    }
}