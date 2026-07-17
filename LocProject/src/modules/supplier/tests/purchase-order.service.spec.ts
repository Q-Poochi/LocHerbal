import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PurchaseOrderStatus } from '@prisma/client';

describe('PurchaseOrderService', () => {
    let service: PurchaseOrderService;
    let prisma: PrismaService;
    let eventEmitter: EventEmitter2;

    const mockPrismaService = {
        supplier: {
            findUnique: jest.fn(),
        },
        purchaseOrder: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        supplierInvoice: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    };

    const mockEventEmitter = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PurchaseOrderService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        service = module.get<PurchaseOrderService>(PurchaseOrderService);
        prisma = module.get<PrismaService>(PrismaService);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generatePONumber', () => {
        it('should return format PO-YYYYMMDD-XXX', async () => {
            const fixedDate = new Date('2026-07-15T10:00:00Z');
            jest.spyOn(global, 'Date').mockImplementation(() => fixedDate as any);

            mockPrismaService.purchaseOrder.count.mockResolvedValue(5);

            const result = await (service as any).generatePoNumber();

            expect(result).toBe('PO-20260715-006');
            expect(mockPrismaService.purchaseOrder.count).toHaveBeenCalledWith({
                where: {
                    createdAt: {
                        gte: new Date('2026-07-15T00:00:00Z'),
                        lt: new Date('2026-07-16T00:00:00Z'),
                    },
                },
            });
        });
    });

    describe('createPO', () => {
        it('should create PO with status DRAFT', async () => {
            mockPrismaService.supplier.findUnique.mockResolvedValue({ id: 'supplier-1', name: 'A' });
            mockPrismaService.purchaseOrder.count.mockResolvedValue(0);
            mockPrismaService.purchaseOrder.create.mockResolvedValue({
                id: 'po-1',
                poNumber: 'PO-20260715-001',
                status: 'DRAFT',
                totalAmount: 1000,
            });

            const dto = {
                supplierId: 'supplier-1',
                expectedDate: '2026-07-20',
                items: [
                    { productVariantId: 'variant-1', qty: 10, unitCost: 100 },
                ],
            };

            const result = await service.createPO(dto, 'user-1');

            expect(mockPrismaService.supplier.findUnique).toHaveBeenCalledWith({
                where: { id: 'supplier-1' },
            });
            expect(mockPrismaService.purchaseOrder.create).toHaveBeenCalledWith({
                data: {
                    supplierId: 'supplier-1',
                    poNumber: 'PO-20260715-001',
                    status: 'DRAFT',
                    totalAmount: 1000,
                    expectedDate: new Date('2026-07-20'),
                    createdBy: 'user-1',
                    items: {
                        create: [
                            { productVariantId: 'variant-1', qty: 10, unitCost: 100 },
                        ],
                    },
                },
                include: { items: true },
            });
            expect(result.status).toBe('DRAFT');
        });

        it('should throw NotFoundException if supplier not found', async () => {
            mockPrismaService.supplier.findUnique.mockResolvedValue(null);

            const dto = {
                supplierId: 'non-existent',
                items: [{ productVariantId: 'variant-1', qty: 10, unitCost: 100 }],
            };

            await expect(service.createPO(dto, 'user-1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('cancelPO', () => {
        it('should cancel PO successfully when status is DRAFT', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValue({
                id: 'po-1',
                status: 'DRAFT',
            });
            mockPrismaService.purchaseOrder.update.mockResolvedValue({
                id: 'po-1',
                status: 'CANCELLED',
            });

            const result = await service.cancelPO('po-1');

            expect(mockPrismaService.purchaseOrder.update).toHaveBeenCalledWith({
                where: { id: 'po-1' },
                data: { status: 'CANCELLED' },
            });
            expect(result.status).toBe('CANCELLED');
        });

        it('should throw BadRequestException if status=RECEIVED', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValue({
                id: 'po-1',
                status: 'RECEIVED',
            });

            await expect(service.cancelPO('po-1')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('receiveItems', () => {
        it('should emit purchase-order.received event', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValue({
                id: 'po-1',
                poNumber: 'PO-20260715-001',
                status: 'DRAFT',
                items: [
                    { productVariantId: 'variant-1', qty: 10 },
                ],
            });

            mockPrismaService.$transaction.mockImplementation(async (cb: any) =>
                cb(mockPrismaService),
            );
            mockPrismaService.purchaseOrder.update.mockResolvedValue({
                id: 'po-1',
                status: 'RECEIVED',
            });
            mockPrismaService.supplierInvoice.create.mockResolvedValue({});

            const dto = {
                items: [
                    {
                        productVariantId: 'variant-1',
                        warehouseId: 'wh-1',
                        qty: 10,
                        unitCost: 100,
                    },
                ],
            };

            await service.receiveItems('po-1', dto as any);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                'purchase-order.received',
                expect.objectContaining({
                    orderId: 'po-1',
                    items: expect.arrayContaining([
                        expect.objectContaining({
                            productVariantId: 'variant-1',
                            warehouseId: 'wh-1',
                            qty: 10,
                            unitCost: 100,
                        }),
                    ]),
                }),
            );
        });

        it('should throw BadRequestException if status=RECEIVED', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValue({
                id: 'po-1',
                status: 'RECEIVED',
            });

            const dto = {
                items: [
                    {
                        productVariantId: 'variant-1',
                        warehouseId: 'wh-1',
                        qty: 10,
                        unitCost: 100,
                    },
                ],
            };

            await expect(service.receiveItems('po-1', dto as any)).rejects.toThrow(
                BadRequestException,
            );
            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should NOT call InventoryService directly', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValue({
                id: 'po-1',
                poNumber: 'PO-20260715-001',
                status: 'DRAFT',
                items: [{ productVariantId: 'variant-1', qty: 10 }],
            });

            mockPrismaService.$transaction.mockImplementation(async (cb: any) =>
                cb(mockPrismaService),
            );
            mockPrismaService.purchaseOrder.update.mockResolvedValue({
                id: 'po-1',
                status: 'RECEIVED',
            });
            mockPrismaService.supplierInvoice.create.mockResolvedValue({});

            const dto = {
                items: [
                    {
                        productVariantId: 'variant-1',
                        warehouseId: 'wh-1',
                        qty: 10,
                        unitCost: 100,
                    },
                ],
            };

            await service.receiveItems('po-1', dto as any);

            expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                'purchase-order.received',
                expect.objectContaining({
                    orderId: 'po-1',
                    items: expect.any(Array),
                }),
            );
        });
    });

    describe('findAll', () => {
        it('should return all purchase orders', async () => {
            mockPrismaService.purchaseOrder.findMany.mockResolvedValue([
                { id: 'po-1', poNumber: 'PO-001', status: 'DRAFT' },
            ]);

            const result = await service.findAll();

            expect(mockPrismaService.purchaseOrder.findMany).toHaveBeenCalledWith({
                where: {},
                include: {
                    supplier: {
                        select: { name: true, phone: true },
                    },
                    _count: {
                        select: { items: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            expect(result).toHaveLength(1);
        });
    });

    describe('findOne', () => {
        it('should throw NotFoundException if not found', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should return PO with supplier and items', async () => {
            mockPrismaService.purchaseOrder.findUnique.mockResolvedValue({
                id: 'po-1',
                poNumber: 'PO-001',
                status: 'DRAFT',
                supplier: { name: 'Supplier A' },
                items: [],
            });

            const result = await service.findOne('po-1');

            expect(mockPrismaService.purchaseOrder.findUnique).toHaveBeenCalledWith({
                where: { id: 'po-1' },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            variant: {
                                select: { sku: true, name: true },
                            },
                        },
                    },
                },
            });
            expect(result.id).toBe('po-1');
        });
    });
});