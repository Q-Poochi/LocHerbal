import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAllocationFailedListener } from '../listeners/inventory-allocation-failed.listener';
import { OrderService } from '../services/order.service';
import { InventoryAllocationFailedEvent } from '../../warehouse/events/inventory-allocation-failed.event';

describe('InventoryAllocationFailedListener (compensating cancel)', () => {
  let listener: InventoryAllocationFailedListener;
  let orderService: OrderService;

  const mockOrderService = {
    cancelOrder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryAllocationFailedListener,
        { provide: OrderService, useValue: mockOrderService },
      ],
    }).compile();

    listener = module.get<InventoryAllocationFailedListener>(InventoryAllocationFailedListener);
    orderService = module.get<OrderService>(OrderService);
  });

  it('should cancel the order via compensating saga when allocation fails', async () => {
    const event = new InventoryAllocationFailedEvent('order-1', 'Không đủ tồn kho', 'v-1', 0);
    mockOrderService.cancelOrder.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' });

    await listener.handleAllocationFailed(event);

    expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(
      'order-1',
      'SYSTEM_COMPENSATING',
      expect.stringContaining('Không đủ tồn kho'),
    );
  });

  it('should not throw when cancelOrder itself fails (already cancelled / race)', async () => {
    const event = new InventoryAllocationFailedEvent('order-1', 'Không đủ tồn kho', 'v-1', 0);
    mockOrderService.cancelOrder.mockRejectedValue(new Error('order already delivered'));

    await expect(listener.handleAllocationFailed(event)).resolves.toBeUndefined();
  });
});
