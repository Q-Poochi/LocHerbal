import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CarrierWebhookService } from '../services/carrier-webhook.service';
import { ShipmentService } from '../services/shipment.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ShipmentStatus } from '@prisma/client';

describe('CarrierWebhookService', () => {
    let service: CarrierWebhookService;
    let shipmentService: ShipmentService;

    const mockPrismaService = {
        shipment: {
            findFirst: jest.fn(),
        },
    };

    const mockShipmentService = {
        applyCarrierStatus: jest.fn(),
    };

    beforeEach(async () => {
        jest.resetModules();
        process.env.GHN_WEBHOOK_TOKEN = 'ghn-secret-token';
        process.env.GHTK_WEBHOOK_TOKEN = 'ghtk-secret-token';

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CarrierWebhookService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ShipmentService, useValue: mockShipmentService },
            ],
        }).compile();

        service = module.get<CarrierWebhookService>(CarrierWebhookService);
        shipmentService = module.get<ShipmentService>(ShipmentService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.GHN_WEBHOOK_TOKEN;
        delete process.env.GHTK_WEBHOOK_TOKEN;
    });

    describe('auth', () => {
        it('GHN: throws UnauthorizedException on wrong token', async () => {
            await expect(service.handleGhn({}, 'wrong')).rejects.toThrow(UnauthorizedException);
        });

        it('GHN: throws UnauthorizedException when token missing', async () => {
            await expect(service.handleGhn({}, undefined)).rejects.toThrow(UnauthorizedException);
        });

        it('GHTK: throws UnauthorizedException on wrong hash', async () => {
            await expect(service.handleGhtk({}, 'wrong')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('GHN mapping', () => {
        it('maps ready_to_pick → PENDING and applies to shipment by OrderCode', async () => {
            mockPrismaService.shipment.findFirst.mockResolvedValue({ id: 'ship-1' });

            await service.handleGhn(
                { OrderCode: 'GHN-ABC', Status: 'ready_to_pick', Time: '2026-08-11T10:00:00Z' },
                'ghn-secret-token',
            );

            expect(mockShipmentService.applyCarrierStatus).toHaveBeenCalledWith(
                'ship-1',
                ShipmentStatus.PENDING,
                expect.stringContaining('GHN: ready_to_pick'),
            );
        });

        it('maps delivered → DELIVERED by ClientOrderCode', async () => {
            mockPrismaService.shipment.findFirst.mockResolvedValue({ id: 'ship-1' });

            await service.handleGhn(
                { ClientOrderCode: 'order-1', Status: 'delivered' },
                'ghn-secret-token',
            );

            expect(mockShipmentService.applyCarrierStatus).toHaveBeenCalledWith(
                'ship-1',
                ShipmentStatus.DELIVERED,
                expect.any(String),
            );
        });

        it('ignores unknown status', async () => {
            const result = await service.handleGhn(
                { OrderCode: 'GHN-1', Status: 'weird_status' },
                'ghn-secret-token',
            );

            expect(result.ignored).toBe(true);
            expect(mockShipmentService.applyCarrierStatus).not.toHaveBeenCalled();
        });

        it('returns ignored=true when shipment not found (no retry loop)', async () => {
            mockPrismaService.shipment.findFirst.mockResolvedValue(null);

            const result = await service.handleGhn(
                { OrderCode: 'GHN-NOPE', Status: 'delivering' },
                'ghn-secret-token',
            );

            expect(result).toEqual({ received: true, ignored: true });
            expect(mockShipmentService.applyCarrierStatus).not.toHaveBeenCalled();
        });
    });

    describe('GHTK mapping', () => {
        it('maps status_id 5 → DELIVERED by label_id', async () => {
            mockPrismaService.shipment.findFirst.mockResolvedValue({ id: 'ship-1' });

            await service.handleGhtk(
                { label_id: 'S1.A1.123', partner_id: 'order-1', status_id: 5 },
                'ghtk-secret-token',
            );

            expect(mockPrismaService.shipment.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { trackingCode: 'S1.A1.123' },
                        { orderId: 'order-1' },
                    ],
                },
            });
            expect(mockShipmentService.applyCarrierStatus).toHaveBeenCalledWith(
                'ship-1',
                ShipmentStatus.DELIVERED,
                expect.any(String),
            );
        });

        it('maps status_id 9 → FAILED', async () => {
            mockPrismaService.shipment.findFirst.mockResolvedValue({ id: 'ship-1' });

            await service.handleGhtk(
                { label_id: 'S1.A1.456', status_id: 9 },
                'ghtk-secret-token',
            );

            expect(mockShipmentService.applyCarrierStatus).toHaveBeenCalledWith(
                'ship-1',
                ShipmentStatus.FAILED,
                expect.any(String),
            );
        });

        it('ignores unknown status_id', async () => {
            const result = await service.handleGhtk(
                { label_id: 'S1.A1.1', status_id: 999 },
                'ghtk-secret-token',
            );

            expect(result.ignored).toBe(true);
            expect(mockShipmentService.applyCarrierStatus).not.toHaveBeenCalled();
        });
    });
});
