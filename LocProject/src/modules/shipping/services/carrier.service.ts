import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CarrierService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(isActive?: boolean) {
        const where = isActive !== undefined ? { isActive } : {};
        return this.prisma.carrier.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const carrier = await this.prisma.carrier.findUnique({
            where: { id },
        });
        if (!carrier) {
            throw new NotFoundException('Không tìm thấy nhà vận chuyển');
        }
        return carrier;
    }

    async create(dto: any) {
        return this.prisma.carrier.create({
            data: {
                name: dto.name,
                code: dto.code,
                apiConfig: dto.apiConfig ?? null,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async update(id: string, dto: any) {
        await this.findOne(id);
        return this.prisma.carrier.update({
            where: { id },
            data: {
                name: dto.name,
                code: dto.code,
                apiConfig: dto.apiConfig,
                isActive: dto.isActive,
            },
        });
    }

    async deactivate(id: string) {
        await this.findOne(id);
        return this.prisma.carrier.update({
            where: { id },
            data: { isActive: false },
        });
    }
}