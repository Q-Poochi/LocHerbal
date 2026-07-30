import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(productId: string, customerId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating phải từ 1 đến 5');
    }
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    const existing = await this.prisma.productReview.findUnique({
      where: { productId_customerId: { productId, customerId } },
    });
    if (existing) throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');

    return this.prisma.productReview.create({
      data: { productId, customerId, rating, comment },
      include: { customer: { select: { fullName: true } } },
    });
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { fullName: true } } },
      }),
      this.prisma.productReview.count({ where: { productId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, customerId: string, rating: number, comment?: string) {
    const review = await this.prisma.productReview.findUnique({ where: { id } });
    if (!review || review.customerId !== customerId) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }
    return this.prisma.productReview.update({
      where: { id },
      data: { rating, comment },
    });
  }

  async remove(id: string, customerId: string) {
    const review = await this.prisma.productReview.findUnique({ where: { id } });
    if (!review || review.customerId !== customerId) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }
    return this.prisma.productReview.delete({ where: { id } });
  }
}
