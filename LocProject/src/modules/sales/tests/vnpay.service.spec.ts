import { Test, TestingModule } from '@nestjs/testing';
import { VNPayService } from '../services/vnpay.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

describe('VNPayService', () => {
  let service: VNPayService;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    // Reset env variables
    delete process.env.VNP_TMN_CODE;
    delete process.env.VNP_HASH_SECRET;
    delete process.env.VNP_URL;

    jest.clearAllMocks();

    // Giả lập transaction — mặc định thành công
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        paymentTransaction: {
          create: jest.fn().mockResolvedValue({ id: 'txn-1' }),
        },
        order: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        orderStatusHistory: {
          create: jest.fn().mockResolvedValue({ id: 'osh-1' }),
        },
      };
      return cb(tx);
    });
  });

  const compileService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VNPayService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<VNPayService>(VNPayService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  };

  it('should log warning and throw ServiceUnavailableException if config is missing', async () => {
    await compileService();
    expect(service).toBeDefined();

    await expect(
      service.createPaymentUrl('order-1', 100000, '127.0.0.1'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  describe('With valid configuration', () => {
    const hashSecret = 'SECRETKEY';

    beforeEach(async () => {
      process.env.VNP_TMN_CODE = 'VNPAY_TMN';
      process.env.VNP_HASH_SECRET = hashSecret;
      process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
      await compileService();
    });

    // Helper: tạo query IPN có chữ ký hợp lệ
    function buildSignedQuery(params: Record<string, string>): Record<string, string> {
      const sortedKeys = Object.keys(params).sort();
      const sortedObj: Record<string, string> = {};
      for (const k of sortedKeys) sortedObj[k] = params[k];
      const signData = new URLSearchParams(sortedObj).toString();
      const hmac = crypto.createHmac('sha512', hashSecret);
      const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      return { ...params, vnp_SecureHash: secureHash };
    }

    it('should generate a valid payment URL with secure hash', async () => {
      const url = await service.createPaymentUrl('order-1', 100000, '127.0.0.1');

      expect(url).toContain('vnp_SecureHash=');
      expect(url).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
      expect(url).toContain('vnp_TxnRef=order-1');
      expect(url).toContain('vnp_Amount=10000000'); // 100k * 100
    });

    it('should fail IPN validation if secure hash is invalid', async () => {
      const query = {
        vnp_TxnRef: 'order-1',
        vnp_ResponseCode: '00',
        vnp_Amount: '10000000',
        vnp_SecureHash: 'wronghash',
      };

      const result = await service.verifyIpn(query);
      expect(result.RspCode).toBe('97');
    });

    it('should verify IPN successfully and emit payment.confirmed event', async () => {
      const query = buildSignedQuery({
        vnp_TxnRef: 'order-1',
        vnp_ResponseCode: '00',
        vnp_Amount: '10000000',
        vnp_TransactionNo: '123456',
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        totalAmount: 100000,
        paymentStatus: PaymentStatus.UNPAID,
        items: [{ productVariantId: 'var-1', qty: 2 }],
      });

      const result = await service.verifyIpn(query);

      expect(result.RspCode).toBe('00');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'payment.confirmed',
        expect.objectContaining({
          orderId: 'order-1',
          items: [{ productVariantId: 'var-1', qty: 2 }],
        }),
      );
    });

    it('should return RspCode 02 when order is already paid (idempotency - updateMany count=0)', async () => {
      // Giả lập updateMany trả count = 0 → đơn đã PAID bởi request trước
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          paymentTransaction: { create: jest.fn() },
          orderStatusHistory: { create: jest.fn() },
        };
        return cb(tx);
      });

      const query = buildSignedQuery({
        vnp_TxnRef: 'order-1',
        vnp_ResponseCode: '00',
        vnp_Amount: '10000000',
        vnp_TransactionNo: '123456',
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        totalAmount: 100000,
        paymentStatus: PaymentStatus.UNPAID, // read ngoài tx thấy UNPAID
        items: [{ productVariantId: 'var-1', qty: 2 }],
      });

      const result = await service.verifyIpn(query);

      expect(result.RspCode).toBe('02');
      expect(result.Message).toBe('Order already confirmed');
      // Không emit event khi đã paid
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should return RspCode 02 when duplicate transactionCode (Prisma P2002)', async () => {
      // Giả lập P2002 unique constraint violation
      const p2002Error: any = new Error('Unique constraint violation');
      p2002Error.code = 'P2002';

      mockPrisma.$transaction.mockRejectedValue(p2002Error);

      const query = buildSignedQuery({
        vnp_TxnRef: 'order-1',
        vnp_ResponseCode: '00',
        vnp_Amount: '10000000',
        vnp_TransactionNo: 'SAME_TXN_ID',
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        totalAmount: 100000,
        paymentStatus: PaymentStatus.UNPAID,
        items: [{ productVariantId: 'var-1', qty: 2 }],
      });

      const result = await service.verifyIpn(query);

      expect(result.RspCode).toBe('02');
      expect(result.Message).toBe('Order already confirmed');
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});

