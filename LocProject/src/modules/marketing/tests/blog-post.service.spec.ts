import { Test, TestingModule } from '@nestjs/testing';
import { BlogPostService } from '../services/blog-post.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('BlogPostService', () => {
    let service: BlogPostService;
    let prisma: PrismaService;

    const mockPrisma = {
        blogPost: {
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
                BlogPostService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<BlogPostService>(BlogPostService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should find all published blog posts', async () => {
        const posts = [{ id: '1', title: 'Test Post', status: 'published' }];
        mockPrisma.blogPost.findMany.mockResolvedValue(posts);

        const result = await service.findAll();
        expect(result).toEqual(posts);
        expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
            where: { status: 'published' },
            include: expect.any(Object),
            orderBy: { publishedAt: 'desc' },
        });
    });

    it('should find blog post by id', async () => {
        const post = { id: '1', title: 'Test Post' };
        mockPrisma.blogPost.findUnique.mockResolvedValue(post);

        const result = await service.findById('1');
        expect(result).toEqual(post);
    });

    it('should find blog post by slug', async () => {
        const post = { id: '1', slug: 'test-post', title: 'Test Post' };
        mockPrisma.blogPost.findUnique.mockResolvedValue(post);

        const result = await service.findBySlug('test-post');
        expect(result).toEqual(post);
    });

    it('should throw NotFoundException when blog post not found', async () => {
        mockPrisma.blogPost.findUnique.mockResolvedValue(null);

        await expect(service.findById('999')).rejects.toThrow('Bài viết không tồn tại');
    });

    it('should create a blog post', async () => {
        const postData = {
            title: 'New Post',
            slug: 'new-post',
            content: 'Content here',
            authorId: '1',
        };
        const createdPost = { id: '1', ...postData, status: 'draft' };
        mockPrisma.blogPost.create.mockResolvedValue(createdPost);

        const result = await service.create(postData);
        expect(result).toEqual(createdPost);
        expect(prisma.blogPost.create).toHaveBeenCalledWith({
            data: { ...postData, status: 'draft' },
            include: expect.any(Object),
        });
    });

    it('should update a blog post', async () => {
        const updatedPost = { id: '1', title: 'Updated Post', status: 'published' };
        mockPrisma.blogPost.update.mockResolvedValue(updatedPost);

        const result = await service.update('1', { title: 'Updated Post', status: 'published' });
        expect(result).toEqual(updatedPost);
    });

    it('should remove a blog post', async () => {
        const deletedPost = { id: '1' };
        mockPrisma.blogPost.delete.mockResolvedValue(deletedPost);

        const result = await service.remove('1');
        expect(result).toEqual(deletedPost);
        expect(prisma.blogPost.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
});