import { Test, TestingModule } from '@nestjs/testing';
import { OrphanedOrderSweeperJob } from './orphaned-order-sweeper.job';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('OrphanedOrderSweeperJob', () => {
  let job: OrphanedOrderSweeperJob;

  const mockPrisma = {
    order: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    paymentTransaction: {
      findFirst: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrphanedOrderSweeperJob,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    job = module.get<OrphanedOrderSweeperJob>(OrphanedOrderSweeperJob);
  });

  it('should cancel orders PENDING > 15 min with no payment', async () => {
    const staleOrder = {
      id: 'order-stale-1',
      status: 'PENDING',
      allocationStatus: 'PENDING',
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    };

    mockPrisma.order.findMany.mockResolvedValue([staleOrder]);
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(null); // Không có payment PAID

    await job.sweepOrphanedOrders();

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        allocationStatus: 'PENDING',
        createdAt: { lt: expect.any(Date) },
      },
    });

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-stale-1' },
      data: {
        status: 'CANCELLED',
        allocationStatus: 'FAILED',
      },
    });

    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-stale-1',
        status: 'CANCELLED',
        note: expect.stringContaining('Tự động hủy bởi Sweeper Job'),
        changedBy: 'SYSTEM_SWEEPER',
      },
    });
  });

  it('should NOT auto-cancel orders that have a PAID transaction (flag for admin review)', async () => {
    const paidStuckOrder = {
      id: 'order-paid-stuck-1',
      status: 'PENDING',
      allocationStatus: 'PENDING',
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    };

    mockPrisma.order.findMany.mockResolvedValue([paidStuckOrder]);
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
      id: 'txn-1',
      orderId: 'order-paid-stuck-1',
      status: 'PAID',
    });

    await job.sweepOrphanedOrders();

    // KHÔNG ĐƯỢC update order sang CANCELLED
    expect(mockPrisma.order.update).not.toHaveBeenCalled();

    // Phải ghi log cảnh báo flag review vào OrderStatusHistory
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-paid-stuck-1',
        status: 'PENDING',
        note: expect.stringContaining('[CẦN ADMIN XỬ LÝ]'),
        changedBy: 'SYSTEM_SWEEPER',
      },
    });
  });

  it('should continue processing other orders if one fails', async () => {
    const order1 = { id: 'order-fail-1', status: 'PENDING', allocationStatus: 'PENDING' };
    const order2 = { id: 'order-success-2', status: 'PENDING', allocationStatus: 'PENDING' };

    mockPrisma.order.findMany.mockResolvedValue([order1, order2]);
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(null);

    // order1 bị lỗi DB update
    mockPrisma.order.update
      .mockRejectedValueOnce(new Error('DB connection timeout'))
      .mockResolvedValueOnce({ id: 'order-success-2', status: 'CANCELLED' });

    await job.sweepOrphanedOrders();

    // Vẫn tiếp tục xử lý order2
    expect(mockPrisma.order.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.order.update).toHaveBeenLastCalledWith({
      where: { id: 'order-success-2' },
      data: {
        status: 'CANCELLED',
        allocationStatus: 'FAILED',
      },
    });
  });

  it('should not touch orders that are not stale (< 15 min)', async () => {
    // Prisma query filter đã đảm bảo createdAt < staleThreshold (15m)
    mockPrisma.order.findMany.mockResolvedValue([]);

    await job.sweepOrphanedOrders();

    expect(mockPrisma.paymentTransaction.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it('should not touch orders already CANCELLED/CONFIRMED', async () => {
    // Khi query DB, Prisma chỉ lấy where status: PENDING và allocationStatus: PENDING
    mockPrisma.order.findMany.mockResolvedValue([]);

    await job.sweepOrphanedOrders();

    const findManyQuery = mockPrisma.order.findMany.mock.calls[0][0];
    expect(findManyQuery.where.status).toBe('PENDING');
    expect(findManyQuery.where.allocationStatus).toBe('PENDING');
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });
});
