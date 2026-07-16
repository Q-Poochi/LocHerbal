import { Test, TestingModule } from '@nestjs/testing';
import { BannerService } from '../services/banner.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('BannerService', () => {
    let service: BannerService;
    let prisma: PrismaService;

    const mockPrisma = {
        banner: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BannerService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<BannerService>(BannerService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should find all banners', async () => {
        const banners = [{ id: '1', title: 'Test Banner' }];
        mockPrisma.banner.findMany.mockResolvedValue(banners);

        const result = await service.findAll();
        expect(result).toEqual(banners);
        expect(prisma.banner.findMany).toHaveBeenCalledWith({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    });

    it('should find banner by id', async () => {
        const banner = { id: '1', title: 'Test Banner' };
        mockPrisma.banner.findUnique.mockResolvedValue(banner);

        const result = await service.findById('1');
        expect(result).toEqual(banner);
    });

    it('should throw NotFoundException when banner not found', async () => {
        mockPrisma.banner.findUnique.mockResolvedValue(null);

        await expect(service.findById('999')).rejects.toThrow('Banner không tồn tại');
    });

    it('should create a banner', async () => {
        const createData = {
            title: 'New Banner',
            imageUrl: 'https://example.com/banner.jpg',
            position: 'homepage',
        };
        const createdBanner = { id: '1', ...createData, sortOrder: 0 };
        mockPrisma.banner.create.mockResolvedValue(createdBanner);

        const result = await service.create(createData);
        expect(result).toEqual(createdBanner);
        expect(prisma.banner.create).toHaveBeenCalledWith({
            data: { ...createData, sortOrder: 0 },
        });
    });

    it('should update a banner', async () => {
        const updatedBanner = { id: '1', title: 'Updated Banner', isActive: true };
        mockPrisma.banner.update.mockResolvedValue(updatedBanner);

        const result = await service.update('1', { title: 'Updated Banner', isActive: true });
        expect(result).toEqual(updatedBanner);
    });

    it('should remove a banner', async () => {
        const deletedBanner = { id: '1' };
        mockPrisma.banner.delete.mockResolvedValue(deletedBanner);

        const result = await service.remove('1');
        expect(result).toEqual(deletedBanner);
        expect(prisma.banner.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
});