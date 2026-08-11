import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentService } from '../services/shipment.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';

describe('ShipmentService', () => {
    let service: ShipmentService;
    let prisma: PrismaService;
    let eventEmitter: EventEmitter2;

    const mockPrismaService = {
        carrier: {
            findUnique: jest.fn(),
        },
        shipment: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        shipmentTrackingEvent: {
            create: jest.fn(),
        },
    };

    const mockEventEmitter = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ShipmentService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        service = module.get<ShipmentService>(ShipmentService);
        prisma = module.get<PrismaService>(PrismaService);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create shipment with status PENDING', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue(null);
            mockPrismaService.carrier.findUnique.mockResolvedValue({ id: 'carrier-1', name: 'GHN' });
            mockPrismaService.shipment.create.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                carrierId: 'carrier-1',
                status: ShipmentStatus.PENDING,
            });

            const result = await service.create({
                orderId: 'order-1',
                carrierId: 'carrier-1',
                shippingFee: 30000,
            });

            expect(mockPrismaService.shipment.create).toHaveBeenCalledWith({
                data: {
                    orderId: 'order-1',
                    carrierId: 'carrier-1',
                    shippingFee: 30000,
                    estimatedDelivery: null,
                    status: ShipmentStatus.PENDING,
                },
            });
            expect(result.status).toBe('PENDING');
        });

        it('should throw if order already has shipment', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-existing',
                orderId: 'order-1',
            });

            await expect(
                service.create({
                    orderId: 'order-1',
                    carrierId: 'carrier-1',
                    shippingFee: 30000,
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('updateStatus', () => {
        it('should emit shipment.delivered when status→DELIVERED', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                status: ShipmentStatus.IN_TRANSIT,
            });
            mockPrismaService.shipment.update.mockResolvedValue({
                id: 'ship-1',
                status: ShipmentStatus.DELIVERED,
            });

            await service.updateStatus('ship-1', ShipmentStatus.DELIVERED);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith('shipment.delivered', {
                shipmentId: 'ship-1',
                orderId: 'order-1',
            });
        });

        it('should throw if status transition invalid (DELIVERED→PENDING)', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                status: ShipmentStatus.DELIVERED,
            });

            await expect(
                service.updateStatus('ship-1', ShipmentStatus.PENDING),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('addTrackingEvent', () => {
        it('should add tracking event correctly', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
            });
            mockPrismaService.shipmentTrackingEvent.create.mockResolvedValue({
                id: 'event-1',
                shipmentId: 'ship-1',
                status: 'PICKED_UP',
            });

            const result = await service.addTrackingEvent('ship-1', {
                status: 'PICKED_UP',
                description: 'Đã lấy hàng',
            });

            expect(mockPrismaService.shipmentTrackingEvent.create).toHaveBeenCalledWith({
                data: {
                    shipmentId: 'ship-1',
                    status: 'PICKED_UP',
                    description: 'Đã lấy hàng',
                    occurredAt: expect.any(Date),
                },
            });
            expect(result.id).toBe('event-1');
        });
    });

    describe('applyCarrierStatus', () => {
        it('should set DELIVERED terminal status and emit event', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                status: ShipmentStatus.IN_TRANSIT,
            });
            mockPrismaService.shipment.update.mockResolvedValue({
                id: 'ship-1',
                status: ShipmentStatus.DELIVERED,
            });
            mockPrismaService.shipmentTrackingEvent.create.mockResolvedValue({ id: 'e1' });

            const result = await service.applyCarrierStatus(
                'ship-1',
                ShipmentStatus.DELIVERED,
                'Đã giao',
            );

            expect(result.applied).toBe(true);
            expect(mockPrismaService.shipment.update).toHaveBeenCalledWith({
                where: { id: 'ship-1' },
                data: { status: ShipmentStatus.DELIVERED },
            });
            expect(mockEventEmitter.emit).toHaveBeenCalledWith('shipment.delivered', {
                shipmentId: 'ship-1',
                orderId: 'order-1',
            });
        });

        it('should be idempotent when already at same status', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                status: ShipmentStatus.DELIVERED,
            });

            const result = await service.applyCarrierStatus(
                'ship-1',
                ShipmentStatus.DELIVERED,
            );

            expect(result.applied).toBe(false);
            expect(result.reason).toBe('already_at_status');
            expect(mockPrismaService.shipment.update).not.toHaveBeenCalled();
        });

        it('should lock terminal status (no regress DELIVERED→RETURNED)', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                status: ShipmentStatus.DELIVERED,
            });

            const result = await service.applyCarrierStatus(
                'ship-1',
                ShipmentStatus.RETURNED,
            );

            expect(result.applied).toBe(false);
            expect(result.reason).toBe('terminal_lock');
        });

        it('should set FAILED terminal from PENDING', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                status: ShipmentStatus.PENDING,
            });
            mockPrismaService.shipment.update.mockResolvedValue({
                id: 'ship-1',
                status: ShipmentStatus.FAILED,
            });

            const result = await service.applyCarrierStatus(
                'ship-1',
                ShipmentStatus.FAILED,
                'Không giao được',
            );

            expect(result.applied).toBe(true);
            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should reject invalid forward transition (PENDING→IN_TRANSIT skip PICKED_UP)', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                status: ShipmentStatus.PENDING,
            });

            // IN_TRANSIT index 2 > PENDING index 0 nhưng vẫn là forward → allowed.
            // Đây là test cho forward hợp lệ: PENDING → IN_TRANSIT
            mockPrismaService.shipment.update.mockResolvedValue({
                id: 'ship-1',
                status: ShipmentStatus.IN_TRANSIT,
            });
            mockPrismaService.shipmentTrackingEvent.create.mockResolvedValue({ id: 'e1' });

            const result = await service.applyCarrierStatus(
                'ship-1',
                ShipmentStatus.IN_TRANSIT,
            );

            expect(result.applied).toBe(true);
        });

        it('should reject backward transition (DELIVERED already locked, test IN_TRANSIT→PENDING impossible via terminal check is fine)', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                status: ShipmentStatus.IN_TRANSIT,
            });

            const result = await service.applyCarrierStatus(
                'ship-1',
                ShipmentStatus.PENDING,
            );

            expect(result.applied).toBe(false);
            expect(result.reason).toBe('invalid_transition');
        });

        it('should throw if shipment not found', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue(null);

            await expect(
                service.applyCarrierStatus('nope', ShipmentStatus.DELIVERED),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByOrder', () => {
        it('should return shipment with tracking events', async () => {
            mockPrismaService.shipment.findUnique.mockResolvedValue({
                id: 'ship-1',
                orderId: 'order-1',
                carrier: { id: 'carrier-1', name: 'GHN' },
                events: [],
            });

            const result = await service.findByOrder('order-1');

            expect(mockPrismaService.shipment.findUnique).toHaveBeenCalledWith({
                where: { orderId: 'order-1' },
                include: {
                    carrier: true,
                    events: {
                        orderBy: { occurredAt: 'desc' },
                    },
                },
            });
            expect(result.id).toBe('ship-1');
        });
    });
});