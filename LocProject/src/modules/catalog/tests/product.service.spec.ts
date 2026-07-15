import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../services/product.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    attributeDefinition: {
      findUnique: jest.fn(),
    },
    productAttributeValue: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertAttributeValue', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertAttributeValue('prod-1', { attributeId: 'attr-1', value: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if attribute definition not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1', categoryId: 'cat-1' });
      mockPrismaService.attributeDefinition.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertAttributeValue('prod-1', { attributeId: 'attr-1', value: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if attribute does not belong to product category', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1', categoryId: 'cat-1' });
      mockPrismaService.attributeDefinition.findUnique.mockResolvedValue({ id: 'attr-1', categoryId: 'cat-2' }); // Khác categoryId (cat-2 vs cat-1)

      await expect(
        service.upsertAttributeValue('prod-1', { attributeId: 'attr-1', value: 'Test' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should upsert value successfully if category matches', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1', categoryId: 'cat-1' });
      mockPrismaService.attributeDefinition.findUnique.mockResolvedValue({ id: 'attr-1', categoryId: 'cat-1' });
      mockPrismaService.productAttributeValue.upsert.mockResolvedValue({
        id: 'val-1',
        productId: 'prod-1',
        attributeId: 'attr-1',
        value: 'TestVal',
      });

      const result = await service.upsertAttributeValue('prod-1', { attributeId: 'attr-1', value: 'TestVal' });
      expect(result.value).toBe('TestVal');
      expect(mockPrismaService.productAttributeValue.upsert).toHaveBeenCalled();
    });
  });
});
