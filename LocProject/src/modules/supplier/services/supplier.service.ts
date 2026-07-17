import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';

export interface SupplierFilters {
    isActive?: boolean;
    search?: string;
}

@Injectable()
export class SupplierService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filters: SupplierFilters = {}) {
        // Mặc định chỉ trả về supplier đang active
        const where: any = { isActive: true };

        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters.search) {
            where.name = { contains: filters.search, mode: 'insensitive' };
        }

        return this.prisma.supplier.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: {
                purchaseOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!supplier) {
            throw new NotFoundException('Không tìm thấy nhà cung cấp');
        }

        return supplier;
    }

    async create(dto: CreateSupplierDto) {
        return this.prisma.supplier.create({
            data: {
                name: dto.name,
                contactPerson: dto.contactPerson,
                phone: dto.phone,
                email: dto.email,
                address: dto.address,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async update(id: string, dto: UpdateSupplierDto) {
        await this.findOne(id);

        return this.prisma.supplier.update({
            where: { id },
            data: {
                name: dto.name,
                contactPerson: dto.contactPerson,
                phone: dto.phone,
                email: dto.email,
                address: dto.address,
                isActive: dto.isActive,
            },
        });
    }

    /**
     * Soft delete — chỉ set isActive = false, KHÔNG hard delete.
     */
    async deactivate(id: string) {
        await this.findOne(id);

        return this.prisma.supplier.update({
            where: { id },
            data: { isActive: false },
        });
    }
}