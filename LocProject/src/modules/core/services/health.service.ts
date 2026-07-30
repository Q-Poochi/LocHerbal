import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class HealthService {
    constructor(private readonly prisma: PrismaService) { }

    async check() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }

    async readiness() {
        let database = 'ok';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch {
            database = 'unreachable';
        }

        return {
            status: database === 'ok' ? 'ready' : 'degraded',
            database,
        };
    }
}
