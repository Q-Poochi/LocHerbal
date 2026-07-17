import { Test, TestingModule } from '@nestjs/testing';
import { SupplierService } from '../services/supplier.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';

describe('SupplierService', () => {
    let service: SupplierService;
    let prisma: PrismaService;

    const mockPrismaService = {
        supplier: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SupplierService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<SupplierService>(SupplierService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create supplier successfully', async () => {
            const dto: CreateSupplierDto = {
                name: 'Nhà cung cấp A',
                contactPerson: 'Nguyễn Văn A',
                phone: '0909123456',
                email: 'a@example.com',
                address: 'Hà Nội',
            };

            mockPrismaService.supplier.create.mockResolvedValue({
                id: 'supplier-1',
                ...dto,
                isActive: true,
            });

            const result = await service.create(dto);

            expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
                data: {
                    name: dto.name,
                    contactPerson: dto.contactPerson,
                    phone: dto.phone,
                    email: dto.email,
                    address: dto.address,
                    isActive: true,
                },
            });
            expect(result.id).toBe('supplier-1');
            expect(result.name).toBe(dto.name);
        });
    });

    describe('deactivate', () => {
        it('should set isActive=false, not delete record', async () => {
            mockPrismaService.supplier.findUnique.mockResolvedValue({ id: 'supplier-1', name: 'A', isActive: true });
            mockPrismaService.supplier.update.mockResolvedValue({ id: 'supplier-1', isActive: false });

            const result = await service.deactivate('supplier-1');

            expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
                where: { id: 'supplier-1' },
                data: { isActive: false },
            });
            expect(result.isActive).toBe(false);
        });
    });

    describe('findAll', () => {
        it('should not return deactivated supplier by default', async () => {
            mockPrismaService.supplier.findMany.mockResolvedValue([]);

            const result = await service.findAll();

            expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });
            expect(result).toEqual([]);
        });

        it('should return deactivated supplier if filter passed', async () => {
            mockPrismaService.supplier.findMany.mockResolvedValue([
                { id: 'supplier-2', name: 'B', isActive: false },
            ]);

            const result = await service.findAll({ isActive: false });

            expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
                where: { isActive: false },
                orderBy: { name: 'asc' },
            });
            expect(result).toHaveLength(1);
            expect(result[0].isActive).toBe(false);
        });

        it('should filter by search term', async () => {
            mockPrismaService.supplier.findMany.mockResolvedValue([]);

            await service.findAll({ search: 'A' });

            expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
                where: {
                    isActive: true,
                    name: { contains: 'A', mode: 'insensitive' },
                },
                orderBy: { name: 'asc' },
            });
        });
    });

    describe('findOne', () => {
        it('should throw NotFoundException if not found', async () => {
            mockPrismaService.supplier.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
        });

        it('should return supplier with purchase orders', async () => {
            mockPrismaService.supplier.findUnique.mockResolvedValue({
                id: 'supplier-1',
                name: 'A',
                purchaseOrders: [],
            });

            const result = await service.findOne('supplier-1');

            expect(mockPrismaService.supplier.findUnique).toHaveBeenCalledWith({
                where: { id: 'supplier-1' },
                include: {
                    purchaseOrders: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            });
            expect(result.id).toBe('supplier-1');
        });
    });

    describe('update', () => {
        it('should update supplier', async () => {
            mockPrismaService.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
            mockPrismaService.supplier.update.mockResolvedValue({ id: 'supplier-1', name: 'New Name' });

            const dto: UpdateSupplierDto = { name: 'New Name' };
            const result = await service.update('supplier-1', dto);

            expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
                where: { id: 'supplier-1' },
                data: {
                    name: 'New Name',
                    contactPerson: undefined,
                    phone: undefined,
                    email: undefined,
                    address: undefined,
                    isActive: undefined,
                },
            });
            expect(result.name).toBe('New Name');
        });
    });
});