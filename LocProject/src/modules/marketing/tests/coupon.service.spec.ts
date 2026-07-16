import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from '../services/coupon.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { DiscountType } from '@prisma/client';

describe('CouponService', () => {
    let service: CouponService;
    let prisma: PrismaService;

    const mockPrisma = {
        coupon: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        couponUsage: {
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CouponService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<CouponService>(CouponService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should validate a coupon code', async () => {
        const coupon = {
            id: '1',
            code: 'TEST10',
            isActive: true,
            startDate: new Date('2020-01-01'),
            endDate: new Date('2030-12-31'),
            minOrderValue: 100000,
            usageLimit: 100,
            usedCount: 50,
        };
        mockPrisma.coupon.findUnique.mockResolvedValue(coupon);

        const result = await service.validateCode('TEST10', 200000);
        expect(result).toEqual(coupon);
    });

    it('should throw NotFoundException for invalid coupon code', async () => {
        mockPrisma.coupon.findUnique.mockResolvedValue(null);

        await expect(service.validateCode('INVALID', 200000)).rejects.toThrow('Mã giảm giá không tồn tại');
    });

    it('should calculate percentage discount', async () => {
        const coupon = {
            id: '1',
            discountType: DiscountType.PERCENTAGE,
            discountValue: 10,
        };
        mockPrisma.coupon.findUnique.mockResolvedValue(coupon);

        const result = await service.calculateDiscount('1', 100000);
        expect(result.discountAmount).toBe(10000);
    });

    it('should calculate fixed amount discount', async () => {
        const coupon = {
            id: '1',
            discountType: DiscountType.FIXED_AMOUNT,
            discountValue: 50000,
        };
        mockPrisma.coupon.findUnique.mockResolvedValue(coupon);

        const result = await service.calculateDiscount('1', 100000);
        expect(result.discountAmount).toBe(50000);
    });

    it('should record coupon usage', async () => {
        const usage = { id: '1', couponId: '1', orderId: '1', customerId: '1' };
        mockPrisma.couponUsage.create.mockResolvedValue(usage);

        const result = await service.recordUsage('1', '1', '1');
        expect(result).toEqual(usage);
    });

    it('should find all coupons', async () => {
        const coupons = [{ id: '1', code: 'TEST10' }];
        mockPrisma.coupon.findMany.mockResolvedValue(coupons);

        const result = await service.findAll();
        expect(result).toEqual(coupons);
    });

    it('should create a coupon', async () => {
        const couponData = {
            code: 'NEW20',
            discountType: DiscountType.PERCENTAGE,
            discountValue: 20,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2025-12-31'),
        };
        const createdCoupon = { id: '1', ...couponData, code: 'NEW20' };
        mockPrisma.coupon.create.mockResolvedValue(createdCoupon);

        const result = await service.create(couponData);
        expect(result).toEqual(createdCoupon);
        expect(prisma.coupon.create).toHaveBeenCalledWith({
            data: { ...couponData, code: 'NEW20', minOrderValue: 0 },
        });
    });

    it('should update a coupon', async () => {
        const updatedCoupon = { id: '1', code: 'UPDATED', isActive: true };
        mockPrisma.coupon.update.mockResolvedValue(updatedCoupon);

        const result = await service.update('1', { code: 'UPDATED', isActive: true });
        expect(result).toEqual(updatedCoupon);
    });

    it('should remove a coupon', async () => {
        const deletedCoupon = { id: '1' };
        mockPrisma.coupon.delete.mockResolvedValue(deletedCoupon);

        const result = await service.remove('1');
        expect(result).toEqual(deletedCoupon);
        expect(prisma.coupon.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
});