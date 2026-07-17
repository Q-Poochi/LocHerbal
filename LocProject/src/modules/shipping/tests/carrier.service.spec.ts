import { Test, TestingModule } from '@nestjs/testing';
import { CarrierService } from '../services/carrier.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('CarrierService', () => {
    let service: CarrierService;
    let prisma: PrismaService;

    const mockPrismaService = {
        carrier: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CarrierService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<CarrierService>(CarrierService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create carrier', async () => {
            mockPrismaService.carrier.create.mockResolvedValue({
                id: 'carrier-1',
                name: 'GHN',
                code: 'GHN',
                isActive: true,
            });

            const result = await service.create({
                name: 'GHN',
                code: 'GHN',
            });

            expect(mockPrismaService.carrier.create).toHaveBeenCalledWith({
                data: {
                    name: 'GHN',
                    code: 'GHN',
                    apiConfig: null,
                    isActive: true,
                },
            });
            expect(result.id).toBe('carrier-1');
        });
    });

    describe('deactivate', () => {
        it('should deactivate (soft delete)', async () => {
            mockPrismaService.carrier.findUnique.mockResolvedValue({ id: 'carrier-1', name: 'GHN' });
            mockPrismaService.carrier.update.mockResolvedValue({ id: 'carrier-1', isActive: false });

            const result = await service.deactivate('carrier-1');

            expect(mockPrismaService.carrier.update).toHaveBeenCalledWith({
                where: { id: 'carrier-1' },
                data: { isActive: false },
            });
            expect(result.isActive).toBe(false);
        });
    });

    describe('findAll', () => {
        it('should not return inactive in default list', async () => {
            mockPrismaService.carrier.findMany.mockResolvedValue([]);

            const result = await service.findAll();

            expect(mockPrismaService.carrier.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { name: 'asc' },
            });
            expect(result).toEqual([]);
        });

        it('should filter by isActive when provided', async () => {
            mockPrismaService.carrier.findMany.mockResolvedValue([
                { id: 'carrier-1', isActive: false },
            ]);

            const result = await service.findAll(false);

            expect(mockPrismaService.carrier.findMany).toHaveBeenCalledWith({
                where: { isActive: false },
                orderBy: { name: 'asc' },
            });
            expect(result).toHaveLength(1);
        });
    });

    describe('findOne', () => {
        it('should return carrier detail', async () => {
            mockPrismaService.carrier.findUnique.mockResolvedValue({
                id: 'carrier-1',
                name: 'GHN',
                code: 'GHN',
            });

            const result = await service.findOne('carrier-1');

            expect(mockPrismaService.carrier.findUnique).toHaveBeenCalledWith({
                where: { id: 'carrier-1' },
            });
            expect(result.id).toBe('carrier-1');
        });

        it('should throw NotFoundException if not found', async () => {
            mockPrismaService.carrier.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow();
        });
    });

    describe('update', () => {
        it('should update carrier', async () => {
            mockPrismaService.carrier.findUnique.mockResolvedValue({ id: 'carrier-1' });
            mockPrismaService.carrier.update.mockResolvedValue({
                id: 'carrier-1',
                name: 'GHTK',
            });

            const result = await service.update('carrier-1', {
                name: 'GHTK',
                code: 'GHTK',
            });

            expect(mockPrismaService.carrier.update).toHaveBeenCalledWith({
                where: { id: 'carrier-1' },
                data: {
                    name: 'GHTK',
                    code: 'GHTK',
                    apiConfig: undefined,
                    isActive: undefined,
                },
            });
            expect(result.name).toBe('GHTK');
        });
    });
});