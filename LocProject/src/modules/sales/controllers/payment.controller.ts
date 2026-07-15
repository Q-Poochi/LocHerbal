import { Controller, Get, Query, Req, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { VNPayService } from '../services/vnpay.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Public } from '../../core/decorators/public.decorator';
import { OrderStatus } from '@prisma/client';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly vnpayService: VNPayService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Tạo URL thanh toán VNPay.
   * Không nhận amount từ client — luôn lấy totalAmount từ DB
   * để chống giả mạo số tiền thanh toán.
   */
  @Get('vnpay-url')
  async getPaymentUrl(
    @Query('orderId') orderId: string,
    @Req() req: Request,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Chỉ cho phép thanh toán đơn đang PENDING
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán');
    }

    // Kiểm tra quyền sở hữu: user đang đăng nhập phải là chủ đơn hàng
    const userId = (req as any).user?.userId;
    if (userId) {
      // Tìm customer theo userId
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
      });
      if (customer && customer.id !== order.customerId) {
        throw new ForbiddenException('Bạn không có quyền thanh toán đơn hàng này');
      }
    }

    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const url = await this.vnpayService.createPaymentUrl(orderId, Number(order.totalAmount), ipAddr);
    return { url };
  }

  @Public()
  @Get('vnpay-ipn')
  async handleIpn(@Query() query: Record<string, any>) {
    return this.vnpayService.verifyIpn(query);
  }

  @Public()
  @Get('vnpay-return')
  async handleReturn(@Query() query: Record<string, any>) {
    return this.vnpayService.verifyReturn(query);
  }
}

