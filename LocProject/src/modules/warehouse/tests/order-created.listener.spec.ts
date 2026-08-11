import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreatedListener } from '../listeners/order-created.listener';
import { InventoryService } from '../services/inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { OrderCreatedEvent } from '../../sales/events/order-created.event';
import { InventoryAllocationFailedEvent } from '../events/inventory-allocation-failed.event';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';

describe('OrderCreatedListener (saga allocate)', () => {
  let listener: OrderCreatedListener;
  let inventoryService: InventoryService;
  let eventEmitter: EventEmitter2;
  let prisma: PrismaService;

  const mockInventory = {
    allocate: jest.fn(),
    release: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockPrisma = {
    order: {
      update: jest.fn().mockResolvedValue({ id: 'order-1' }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreatedListener,
        { provide: InventoryService, useValue: mockInventory },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    listener = module.get<OrderCreatedListener>(OrderCreatedListener);
    inventoryService = module.get<InventoryService>(InventoryService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const event = new OrderCreatedEvent('order-1', [
    { productVariantId: 'v-1', qty: 2 },
    { productVariantId: 'v-2', qty: 3 },
  ]);

  it('should allocate all items and set allocationStatus = ALLOCATED', async () => {
    mockInventory.allocate.mockResolvedValue({ success: true });

    const result = await listener.handleOrderCreatedEvent(event);

    expect(mockInventory.allocate).toHaveBeenCalledTimes(2);
    expect(mockInventory.allocate).toHaveBeenCalledWith('v-1', 2, 'order-1');
    expect(mockInventory.allocate).toHaveBeenCalledWith('v-2', 3, 'order-1');
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { allocationStatus: 'ALLOCATED' },
    });
    expect(result).toEqual({ success: true });
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('should release successfully-allocated items, set FAILED and emit inventory.allocation.failed on failure', async () => {
    mockInventory.allocate
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new InsufficientStockException('v-2', 3, 0));

    const result = await listener.handleOrderCreatedEvent(event);

    // Item 1 được release (compensation), item 2 fail nên không release
    expect(mockInventory.release).toHaveBeenCalledTimes(1);
    expect(mockInventory.release).toHaveBeenCalledWith('v-1', 2, 'order-1');
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { allocationStatus: 'FAILED' },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'inventory.allocation.failed',
      expect.any(InventoryAllocationFailedEvent),
    );
    expect(result).toEqual({ success: false, reason: expect.any(String) });
  });

  it('should not release anything, set FAILED and still emit failed event when first item fails', async () => {
    mockInventory.allocate.mockRejectedValue(new InsufficientStockException('v-1', 2, 0));

    const result = await listener.handleOrderCreatedEvent(event);

    expect(mockInventory.release).not.toHaveBeenCalled();
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { allocationStatus: 'FAILED' },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'inventory.allocation.failed',
      expect.any(InventoryAllocationFailedEvent),
    );
    expect(result).toEqual({ success: false, reason: expect.any(String) });
  });

  it('should still return failure when marking FAILED fails (does not mask original error)', async () => {
    mockInventory.allocate.mockRejectedValue(new InsufficientStockException('v-1', 2, 0));
    mockPrisma.order.update.mockRejectedValue(new Error('db down'));

    const result = await listener.handleOrderCreatedEvent(event);

    expect(result).toEqual({ success: false, reason: expect.any(String) });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'inventory.allocation.failed',
      expect.any(InventoryAllocationFailedEvent),
    );
  });
});
