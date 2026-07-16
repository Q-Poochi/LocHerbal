import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { DiscountType } from '@prisma/client';

@Injectable()
export class CouponService {
    constructor(private readonly prisma: PrismaService) { }

    async validateCode(code: string, orderValue: number) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) {
            throw new NotFoundException('Mã giảm giá không tồn tại');
        }

        if (!coupon.isActive) {
            throw new BadRequestException('Mã giảm giá đã bị vô hiệu hóa');
        }

        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            throw new BadRequestException('Mã giảm giá không trong thời hạn sử dụng');
        }

        if (coupon.minOrderValue && orderValue < Number(coupon.minOrderValue)) {
            throw new BadRequestException(
                `Đơn hàng tối thiểu ${Number(coupon.minOrderValue).toLocaleString('vi-VN')}đ để áp dụng mã này`
            );
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
        }

        return coupon;
    }

    async calculateDiscount(couponId: string, orderValue: number) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id: couponId },
        });

        if (!coupon) {
            throw new NotFoundException('Mã giảm giá không tồn tại');
        }

        let discountAmount = 0;
        if (coupon.discountType === DiscountType.PERCENTAGE) {
            discountAmount = (orderValue * Number(coupon.discountValue)) / 100;
        } else {
            discountAmount = Number(coupon.discountValue);
        }

        return {
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            discountAmount: Math.min(discountAmount, orderValue),
        };
    }

    async recordUsage(couponId: string, orderId: string, customerId: string) {
        return this.prisma.couponUsage.create({
            data: {
                couponId,
                orderId,
                customerId,
            },
        });
    }

    async findAll() {
        return this.prisma.coupon.findMany({
            include: {
                campaign: true,
                _count: {
                    select: { usages: true },
                },
            },
            orderBy: { id: 'desc' },
        });
    }

    async findById(id: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id },
            include: {
                campaign: true,
            },
        });
        if (!coupon) {
            throw new NotFoundException('Mã giảm giá không tồn tại');
        }
        return coupon;
    }

    async create(data: {
        code: string;
        discountType: DiscountType;
        discountValue: number;
        minOrderValue?: number;
        usageLimit?: number;
        startDate: Date;
        endDate: Date;
        campaignId?: string;
    }) {
        return this.prisma.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                discountType: data.discountType,
                discountValue: data.discountValue,
                minOrderValue: data.minOrderValue ?? 0,
                usageLimit: data.usageLimit,
                startDate: data.startDate,
                endDate: data.endDate,
                campaignId: data.campaignId,
            },
        });
    }

    async update(id: string, data: {
        code?: string;
        discountType?: DiscountType;
        discountValue?: number;
        minOrderValue?: number;
        usageLimit?: number;
        startDate?: Date;
        endDate?: Date;
        isActive?: boolean;
    }) {
        const updateData: any = { ...data };
        if (data.code) {
            updateData.code = data.code.toUpperCase();
        }

        const coupon = await this.prisma.coupon.update({
            where: { id },
            data: updateData,
        });
        if (!coupon) {
            throw new NotFoundException('Mã giảm giá không tồn tại');
        }
        return coupon;
    }

    async remove(id: string) {
        return this.prisma.coupon.delete({
            where: { id },
        });
    }
}