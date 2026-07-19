import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomerController } from '../controllers/customer.controller';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('CustomerController', () => {
    let controller: CustomerController;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CustomerController],
            providers: [
                {
                    provide: PrismaService,
                    useValue: {
                        customer: {
                            findUnique: jest.fn(),
                        },
                        customerAddress: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            updateMany: jest.fn(),
                            delete: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        controller = module.get<CustomerController>(CustomerController);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createAddress', () => {
        it('should create address', async () => {
            const dto = {
                recipientName: 'Nguyen Van A',
                phone: '0909123456',
                addressLine: '123 Nguyen Trai',
                province: 'Hanoi',
                isDefault: true,
            };

            (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 'customer-1' });
            (prisma.customerAddress.updateMany as jest.Mock).mockResolvedValue({});
            (prisma.customerAddress.create as jest.Mock).mockResolvedValue({ id: 'address-1', ...dto });

            const result = await controller.createAddress(dto, { user: { userId: 'user-1' } } as any);
            expect(result).toEqual(expect.objectContaining({ id: 'address-1' }));
            expect(prisma.customerAddress.updateMany).toHaveBeenCalledWith({
                where: { customerId: 'customer-1' },
                data: { isDefault: false },
            });
        });

        it('should throw NotFoundException when customer not found', async () => {
            (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(controller.createAddress({} as any, { user: { userId: 'user-1' } } as any)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('listAddresses', () => {
        it('should return list addresses', async () => {
            (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 'customer-1' });
            (prisma.customerAddress.findMany as jest.Mock).mockResolvedValue([{ id: 'address-1' }]);
            const result = await controller.listAddresses({ user: { userId: 'user-1' } } as any);
            expect(result).toEqual([{ id: 'address-1' }]);
        });
    });

    describe('updateAddress', () => {
        it('should update address', async () => {
            (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 'customer-1' });
            (prisma.customerAddress.findUnique as jest.Mock).mockResolvedValue({ id: 'address-1', customerId: 'customer-1' });
            (prisma.customerAddress.update as jest.Mock).mockResolvedValue({ id: 'address-1' });

            const result = await controller.updateAddress(
                'address-1',
                { recipientName: 'New Name', phone: '0909123456', addressLine: '456 X', province: 'Hanoi' } as any,
                { user: { userId: 'user-1' } } as any,
            );
            expect(result).toEqual(expect.objectContaining({ id: 'address-1' }));
        });
    });

    describe('deleteAddress', () => {
        it('should delete address', async () => {
            (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 'customer-1' });
            (prisma.customerAddress.findUnique as jest.Mock).mockResolvedValue({ id: 'address-1', customerId: 'customer-1' });
            (prisma.customerAddress.delete as jest.Mock).mockResolvedValue({ id: 'address-1' });

            const result = await controller.deleteAddress('address-1', { user: { userId: 'user-1' } } as any);
            expect(result).toEqual({ message: 'Xoá địa chỉ thành công' });
        });
    });
});