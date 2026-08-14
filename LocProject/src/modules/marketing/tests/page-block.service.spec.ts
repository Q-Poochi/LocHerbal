import { Test, TestingModule } from '@nestjs/testing';
import { PageBlockService } from '../services/page-block.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PageBlockType } from '../dto/page-block.dto';

describe('PageBlockService', () => {
    let service: PageBlockService;
    let prisma: PrismaService;

    const mockPrisma = {
        pageBlock: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
        },
        $transaction: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PageBlockService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<PageBlockService>(PageBlockService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findPublished — chỉ trả blocks đã publish, sort theo order', async () => {
        const blocks = [
            { id: '1', type: 'text', order: 0, isPublished: true },
            { id: '2', type: 'hero', order: 1, isPublished: true },
        ];
        mockPrisma.pageBlock.findMany.mockResolvedValue(blocks);

        const result = await service.findPublished('about-us');
        expect(result).toEqual(blocks);
        expect(prisma.pageBlock.findMany).toHaveBeenCalledWith({
            where: { page: 'about-us', isPublished: true },
            orderBy: { order: 'asc' },
        });
    });

    it('findAll — trả tất cả blocks kể cả chưa publish', async () => {
        const blocks = [{ id: '1', type: 'text', order: 0, isPublished: false }];
        mockPrisma.pageBlock.findMany.mockResolvedValue(blocks);

        const result = await service.findAll('about-us');
        expect(result).toEqual(blocks);
        expect(prisma.pageBlock.findMany).toHaveBeenCalledWith({
            where: { page: 'about-us' },
            orderBy: { order: 'asc' },
        });
    });

    it('findById — trả block', async () => {
        const block = { id: '1', type: 'text' };
        mockPrisma.pageBlock.findUnique.mockResolvedValue(block);

        const result = await service.findById('1');
        expect(result).toEqual(block);
    });

    it('findById — ném NotFound khi không tồn tại', async () => {
        mockPrisma.pageBlock.findUnique.mockResolvedValue(null);

        await expect(service.findById('999')).rejects.toThrow('Block không tồn tại');
    });

    it('create — gán order = max+1 và content mặc định theo type', async () => {
        mockPrisma.pageBlock.aggregate.mockResolvedValue({ _max: { order: 2 } });
        const created = { id: '1', page: 'about-us', type: 'text', order: 3, content: { heading: '', body: '' } };
        mockPrisma.pageBlock.create.mockResolvedValue(created);

        const result = await service.create('about-us', PageBlockType.TEXT, { heading: 'Xin chào' });
        expect(result).toEqual(created);
        expect(prisma.pageBlock.create).toHaveBeenCalledWith({
            data: {
                page: 'about-us',
                type: 'text',
                order: 3,
                content: { heading: 'Xin chào', body: '' },
            },
        });
    });

    it('update — merge content mới với content cũ', async () => {
        const existing = { id: '1', content: { heading: 'Cũ', body: 'Giữ nguyên' } };
        mockPrisma.pageBlock.findUnique.mockResolvedValue(existing);
        mockPrisma.pageBlock.update.mockResolvedValue({ id: '1', content: { heading: 'Mới', body: 'Giữ nguyên' } });

        const result = await service.update('1', { content: { heading: 'Mới' } });
        expect(result.content).toEqual({ heading: 'Mới', body: 'Giữ nguyên' });
    });

    it('update — cập nhật isPublished', async () => {
        const existing = { id: '1', content: { heading: 'X' }, isPublished: true };
        mockPrisma.pageBlock.findUnique.mockResolvedValue(existing);
        mockPrisma.pageBlock.update.mockResolvedValue({ id: '1', isPublished: false });

        await service.update('1', { isPublished: false });
        expect(prisma.pageBlock.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { content: { heading: 'X' }, isPublished: false },
        });
    });

    it('reorder — cập nhật thứ tự trong 1 transaction', async () => {
        const items = [
            { id: 'a', order: 1 },
            { id: 'b', order: 0 },
        ];
        mockPrisma.pageBlock.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
        mockPrisma.$transaction.mockResolvedValue([{}, {}]);

        await service.reorder('about-us', items);
        expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('reorder — ném BadRequest khi items rỗng', async () => {
        await expect(service.reorder('about-us', [])).rejects.toThrow('Danh sách thứ tự trống');
    });

    it('reorder — ném BadRequest khi block không thuộc trang (IDOR)', async () => {
        mockPrisma.pageBlock.findMany.mockResolvedValue([{ id: 'a' }]);

        await expect(
            service.reorder('about-us', [{ id: 'b', order: 0 }]),
        ).rejects.toThrow(`Block b không thuộc trang about-us`);
    });

    it('remove — xoá block', async () => {
        mockPrisma.pageBlock.findUnique.mockResolvedValue({ id: '1' });
        mockPrisma.pageBlock.delete.mockResolvedValue({ id: '1' });

        const result = await service.remove('1');
        expect(result).toEqual({ success: true });
        expect(prisma.pageBlock.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('remove — ném NotFound khi block không tồn tại', async () => {
        mockPrisma.pageBlock.findUnique.mockResolvedValue(null);

        await expect(service.remove('999')).rejects.toThrow('Block không tồn tại');
    });
});