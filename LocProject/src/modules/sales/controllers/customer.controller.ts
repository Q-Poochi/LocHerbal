import { Controller, Post, Body, Req, Get, Param, Patch, Delete, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateCustomerAddressDto } from '../dto/customer.dto';

@Controller('customers')
export class CustomerController {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * POST /customers/addresses
     * Tạo địa chỉ giao hàng mới cho customer hiện tại.
     */
    @Post('addresses')
    @UseGuards(JwtAuthGuard)
    async createAddress(@Body() dto: CreateCustomerAddressDto, @Req() req: Request) {
        const userId = (req as any).user?.userId;
        if (!userId) {
            throw new BadRequestException('Không xác định được người dùng');
        }

        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!customer) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }

        // Nếu đánh dấu isDefault = true, reset các địa chỉ default khác
        if (dto.isDefault) {
            await this.prisma.customerAddress.updateMany({
                where: { customerId: customer.id },
                data: { isDefault: false },
            });
        }

        const address = await this.prisma.customerAddress.create({
            data: {
                customerId: customer.id,
                recipientName: dto.recipientName,
                phone: dto.phone,
                addressLine: dto.addressLine,
                ward: dto.ward,
                district: dto.district,
                province: dto.province,
                isDefault: dto.isDefault ?? false,
            },
        });

        return address;
    }

    /**
     * GET /customers/addresses
     * Danh sách địa chỉ của customer hiện tại.
     */
    @Get('addresses')
    @UseGuards(JwtAuthGuard)
    async listAddresses(@Req() req: Request) {
        const userId = (req as any).user?.userId;
        if (!userId) {
            throw new BadRequestException('Không xác định được người dùng');
        }

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

    /**
     * PATCH /customers/addresses/:id
     * Cập nhật địa chỉ.
     */
    @Patch('addresses/:id')
    @UseGuards(JwtAuthGuard)
    async updateAddress(@Param('id') id: string, @Body() dto: CreateCustomerAddressDto, @Req() req: Request) {
        const userId = (req as any).user?.userId;
        if (!userId) {
            throw new BadRequestException('Không xác định được người dùng');
        }

        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!customer) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }

        const existing = await this.prisma.customerAddress.findUnique({
            where: { id },
        });

        if (!existing || existing.customerId !== customer.id) {
            throw new NotFoundException('Không tìm thấy địa chỉ');
        }

        if (dto.isDefault) {
            await this.prisma.customerAddress.updateMany({
                where: { customerId: customer.id, id: { not: id } },
                data: { isDefault: false },
            });
        }

        return this.prisma.customerAddress.update({
            where: { id },
            data: {
                recipientName: dto.recipientName,
                phone: dto.phone,
                addressLine: dto.addressLine,
                ward: dto.ward,
                district: dto.district,
                province: dto.province,
                isDefault: dto.isDefault ?? existing.isDefault,
            },
        });
    }

    /**
     * DELETE /customers/addresses/:id
     * Xoá địa chỉ.
     */
    @Delete('addresses/:id')
    @UseGuards(JwtAuthGuard)
    async deleteAddress(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user?.userId;
        if (!userId) {
            throw new BadRequestException('Không xác định được người dùng');
        }

        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!customer) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }

        const existing = await this.prisma.customerAddress.findUnique({
            where: { id },
        });

        if (!existing || existing.customerId !== customer.id) {
            throw new NotFoundException('Không tìm thấy địa chỉ');
        }

        await this.prisma.customerAddress.delete({
            where: { id },
        });

        return { message: 'Xoá địa chỉ thành công' };
    }
}