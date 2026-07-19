import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateAddressDto } from '../dto/create-address.dto';

@Injectable()
export class AddressService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(userId: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!customer) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }

        return this.prisma.customerAddress.findMany({
            where: { customerId: customer.id },
        });
    }

    async create(userId: string, dto: CreateAddressDto) {
        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!customer) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }

        const existingCount = await this.prisma.customerAddress.count({
            where: { customerId: customer.id },
        });

        const isDefault = existingCount === 0 ? true : dto.isDefault ?? false;

        if (isDefault) {
            await this.prisma.customerAddress.updateMany({
                where: { customerId: customer.id },
                data: { isDefault: false },
            });
        }

        return this.prisma.customerAddress.create({
            data: {
                customerId: customer.id,
                recipientName: dto.recipientName,
                phone: dto.phone,
                addressLine: dto.addressLine,
                ward: dto.ward,
                district: dto.district,
                province: dto.province,
                isDefault,
            },
        });
    }

    async setDefault(id: string, userId: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!customer) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }

        const address = await this.prisma.customerAddress.findUnique({
            where: { id },
        });

        if (!address || address.customerId !== customer.id) {
            throw new NotFoundException('Không tìm thấy địa chỉ');
        }

        await this.prisma.customerAddress.updateMany({
            where: { customerId: customer.id },
            data: { isDefault: false },
        });

        return this.prisma.customerAddress.update({
            where: { id },
            data: { isDefault: true },
        });
    }

    async delete(id: string, userId: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!customer) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }

        const address = await this.prisma.customerAddress.findUnique({
            where: { id },
        });

        if (!address || address.customerId !== customer.id) {
            throw new NotFoundException('Không tìm thấy địa chỉ');
        }

        await this.prisma.customerAddress.delete({
            where: { id },
        });

        return { message: 'Xoá địa chỉ thành công' };
    }
}