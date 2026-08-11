import { Test, TestingModule } from '@nestjs/testing';
import { PaymentConfirmedListener } from '../listeners/payment-confirmed.listener';
import { InventoryService } from '../services/inventory.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PaymentConfirmedEvent } from '../../sales/events/payment-confirmed.event';

describe('PaymentConfirmedListener (saga deduct)', () => {
  let listener: PaymentConfirmedListener;
  let inventoryService: InventoryService;
  let prisma: PrismaService;

  const mockInventory = {
    isOrderFullyAllocated: jest.fn(),
    deduct: jest.fn(),
  };

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn().mockResolvedValue({ id: 'h-1' }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentConfirmedListener,
        { provide: InventoryService, useValue: mockInventory },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    listener = module.get<PaymentConfirmedListener>(PaymentConfirmedListener);
    inventoryService = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const event = new PaymentConfirmedEvent('order-1', [
    { productVariantId: 'v-1', qty: 2 },
    { productVariantId: 'v-2', qty: 3 },
  ]);

  it('should NOT deduct when allocationStatus = FAILED', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ allocationStatus: 'FAILED' });

    await listener.handlePaymentConfirmedEvent(event);

    expect(mockInventory.deduct).not.toHaveBeenCalled();
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-1',
          note: expect.stringContaining('FAILED'),
          changedBy: 'WAREHOUSE_AUDIT',
        }),
      }),
    );
  });

  it('should NOT deduct when order not found (treated as FAILED)', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null);

    await listener.handlePaymentConfirmedEvent(event);

    expect(mockInventory.deduct).not.toHaveBeenCalled();
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledTimes(1);
  });

  it('should retry and deduct after allocation becomes ALLOCATED (PENDING -> ALLOCATED)', async () => {
    mockPrisma.order.findUnique
      .mockResolvedValueOnce({ allocationStatus: 'PENDING' })
      .mockResolvedValueOnce({ allocationStatus: 'ALLOCATED' });
    mockInventory.isOrderFullyAllocated.mockResolvedValue(true);
    mockInventory.deduct.mockResolvedValue({ success: true });

    await listener.handlePaymentConfirmedEvent(event);

    expect(mockPrisma.order.findUnique).toHaveBeenCalledTimes(2);
    expect(mockInventory.deduct).toHaveBeenCalledTimes(2);
    expect(mockInventory.deduct).toHaveBeenCalledWith('v-1', 2, 'order-1');
    expect(mockInventory.deduct).toHaveBeenCalledWith('v-2', 3, 'order-1');
    expect(mockPrisma.orderStatusHistory.create).not.toHaveBeenCalled();
  });

  it('should NOT deduct when allocation stays PENDING after max retries', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ allocationStatus: 'PENDING' });

    await listener.handlePaymentConfirmedEvent(event);

    expect(mockPrisma.order.findUnique).toHaveBeenCalledTimes(3);
    expect(mockInventory.deduct).not.toHaveBeenCalled();
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledTimes(1);
  });

  it('should deduct all items when allocationStatus = ALLOCATED', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ allocationStatus: 'ALLOCATED' });
    mockInventory.isOrderFullyAllocated.mockResolvedValue(true);
    mockInventory.deduct.mockResolvedValue({ success: true });

    await listener.handlePaymentConfirmedEvent(event);

    expect(mockInventory.deduct).toHaveBeenCalledTimes(2);
    expect(mockInventory.deduct).toHaveBeenCalledWith('v-1', 2, 'order-1');
    expect(mockInventory.deduct).toHaveBeenCalledWith('v-2', 3, 'order-1');
    expect(mockPrisma.orderStatusHistory.create).not.toHaveBeenCalled();
  });

  it('should NOT deduct when allocationStatus=ALLOCATED but reserve insufficient (defense-in-depth)', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ allocationStatus: 'ALLOCATED' });
    mockInventory.isOrderFullyAllocated.mockResolvedValue(false);

    await listener.handlePaymentConfirmedEvent(event);

    expect(mockInventory.deduct).not.toHaveBeenCalled();
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledTimes(1);
  });

  it('should log audit entry when a deduct fails but continue others', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ allocationStatus: 'ALLOCATED' });
    mockInventory.isOrderFullyAllocated.mockResolvedValue(true);
    mockInventory.deduct
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('insufficient'));

    await listener.handlePaymentConfirmedEvent(event);

    expect(mockInventory.deduct).toHaveBeenCalledTimes(2);
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledTimes(1);
  });
});
