import { Injectable, Logger, ServiceUnavailableException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentConfirmedEvent } from '../events/payment-confirmed.event';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class VNPayService {
  private readonly logger = new Logger(VNPayService.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly vnpUrl: string;
  private readonly returnUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Để phục vụ unit test độc lập khi không có ConfigService thực sự, ta sẽ đọc từ process.env trực tiếp
    this.tmnCode = process.env.VNP_TMN_CODE || '';
    this.hashSecret = process.env.VNP_HASH_SECRET || '';
    this.vnpUrl = process.env.VNP_URL || '';
    this.returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/vnpay-return';

    if (!this.tmnCode || !this.hashSecret || !this.vnpUrl) {
      this.logger.warn('Cấu hình VNPay bị thiếu. Dịch vụ thanh toán VNPay sẽ tạm thời không khả dụng.');
    }
  }

  private checkConfig() {
    if (!this.tmnCode || !this.hashSecret || !this.vnpUrl) {
      throw new ServiceUnavailableException('Dịch vụ thanh toán VNPay chưa được cấu hình');
    }
  }

  async createPaymentUrl(orderId: string, amount: number, ipAddr: string): Promise<string> {
    this.checkConfig();

    const date = new Date();
    const createDate = this.formatDate(date);
    
    // Đơn vị VND cần nhân 100 theo yêu cầu VNPay
    const vnpAmount = amount * 100;
    
    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: vnpAmount.toString(),
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort params
    const sortedParams = this.sortObject(vnpParams);
    
    // Build query string
    const signData = new URLSearchParams(sortedParams).toString();
    
    // Hash
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    sortedParams['vnp_SecureHash'] = secureHash;

    return `${this.vnpUrl}?${new URLSearchParams(sortedParams).toString()}`;
  }

  async verifyIpn(query: Record<string, any>) {
    this.checkConfig();

    const secureHash = query['vnp_SecureHash'];
    if (!secureHash) {
      throw new BadRequestException('Thừa hoặc thiếu chữ ký bảo mật SecureHash');
    }

    // Clone & remove secure hash params
    const vnpParams = { ...query };
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort & build sign data
    const sortedParams = this.sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();

    // Verify signature
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (calculatedHash !== secureHash) {
      this.logger.error('Chữ ký checksum từ VNPay không khớp!');
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const orderId = query['vnp_TxnRef'];
    const vnpResponseCode = query['vnp_ResponseCode'];
    const amount = Number(query['vnp_Amount']) / 100;
    const vnpTxnId = query['vnp_TransactionNo'];

    // Tìm order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Đảm bảo số tiền khớp (tránh giả mạo số tiền)
    if (Number(order.totalAmount) !== amount) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    const isSuccess = vnpResponseCode === '00';

    try {
      await this.prisma.$transaction(async (tx) => {
        // Idempotency check BÊN TRONG transaction:
        // Dùng updateMany có điều kiện paymentStatus != PAID thay vì đọc trước rồi check.
        // Nếu affected = 0 nghĩa là đơn đã được xử lý bởi request khác.
        const updateResult = await tx.order.updateMany({
          where: {
            id: orderId,
            paymentStatus: { not: PaymentStatus.PAID },
          },
          data: {
            paymentStatus: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
            status: isSuccess ? OrderStatus.CONFIRMED : order.status,
          },
        });

        if (updateResult.count === 0) {
          // Đơn hàng đã được xử lý bởi IPN request trước đó
          throw new AlreadyPaidError();
        }

        // Tạo Transaction log
        await tx.paymentTransaction.create({
          data: {
            orderId,
            provider: 'VNPAY',
            transactionCode: vnpTxnId || `VNP-${Date.now()}`,
            amount,
            status: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
            rawResponse: query,
          },
        });

        // Ghi history
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: isSuccess ? OrderStatus.CONFIRMED : order.status,
            note: isSuccess ? `Thanh toán qua VNPay thành công. Mã GD: ${vnpTxnId}` : `Thanh toán qua VNPay thất bại. Mã lỗi: ${vnpResponseCode}`,
            changedBy: 'VNPAY_IPN',
          },
        });
      });
    } catch (error) {
      // Xử lý idempotency: đơn đã thanh toán
      if (error instanceof AlreadyPaidError) {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      if ((error as any)?.code === 'P2002') {
        this.logger.warn(`Duplicate IPN transactionCode for order ${orderId}, returning 02`);
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      throw error;
    }

    // Emit event nếu thanh toán thành công để deduct kho
    if (isSuccess) {
      const eventItems = order.items.map((item) => ({
        productVariantId: item.productVariantId,
        qty: item.qty,
      }));
      this.eventEmitter.emit('payment.confirmed', new PaymentConfirmedEvent(orderId, eventItems));
    }

    return { RspCode: '00', Message: 'Confirm success' };
  }

  async verifyReturn(query: Record<string, any>) {
    this.checkConfig();

    const secureHash = query['vnp_SecureHash'];
    if (!secureHash) {
      return { success: false, message: 'Thừa hoặc thiếu chữ ký bảo mật SecureHash' };
    }

    const vnpParams = { ...query };
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();

    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (calculatedHash !== secureHash) {
      return { success: false, message: 'Chữ ký VNPay không hợp lệ' };
    }

    const isSuccess = query['vnp_ResponseCode'] === '00';
    return {
      success: isSuccess,
      orderId: query['vnp_TxnRef'],
      amount: Number(query['vnp_Amount']) / 100,
      message: isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại hoặc bị hủy',
    };
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const hh = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return yyyy + mm + dd + hh + min + ss;
  }
}

/**
 * Marker error nội bộ dùng để thoát khỏi transaction khi đơn hàng đã được xử lý.
 * Không expose ra ngoài — chỉ dùng trong verifyIpn().
 */
class AlreadyPaidError extends Error {
  constructor() {
    super('Order already paid');
    this.name = 'AlreadyPaidError';
  }
}
