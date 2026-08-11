import { Test, TestingModule } from '@nestjs/testing';
import { OrderCancelledListener } from '../listeners/order-cancelled.listener';
import { InventoryService } from '../services/inventory.service';
import { OrderCancelledEvent } from '../../sales/events/order-cancelled.event';

describe('OrderCancelledListener (saga release)', () => {
  let listener: OrderCancelledListener;
  let inventoryService: InventoryService;

  const mockInventory = {
    release: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCancelledListener,
        { provide: InventoryService, useValue: mockInventory },
      ],
    }).compile();

    listener = module.get<OrderCancelledListener>(OrderCancelledListener);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  it('should release inventory for all cancelled items', async () => {
    const event = new OrderCancelledEvent('order-1', [
      { productVariantId: 'v-1', qty: 2 },
      { productVariantId: 'v-2', qty: 5 },
    ]);
    mockInventory.release.mockResolvedValue({ success: true });

    await listener.handleOrderCancelledEvent(event);

    expect(mockInventory.release).toHaveBeenCalledTimes(2);
    expect(mockInventory.release).toHaveBeenCalledWith('v-1', 2, 'order-1');
    expect(mockInventory.release).toHaveBeenCalledWith('v-2', 5, 'order-1');
  });

  it('should continue releasing remaining items even if one release fails', async () => {
    const event = new OrderCancelledEvent('order-1', [
      { productVariantId: 'v-1', qty: 2 },
      { productVariantId: 'v-2', qty: 5 },
    ]);
    mockInventory.release
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ success: true });

    // Per-item try/catch: fail item 1 KHÔNG chặn item 2 — tránh rò stock
    await expect(listener.handleOrderCancelledEvent(event)).resolves.toBeUndefined();
    expect(mockInventory.release).toHaveBeenCalledTimes(2);
    expect(mockInventory.release).toHaveBeenCalledWith('v-2', 5, 'order-1');
  });
});
