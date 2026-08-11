import { Test, TestingModule } from '@nestjs/testing';
import { OrderConfirmedListener } from '../listeners/order-confirmed.listener';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('OrderConfirmedListener (shipping ready)', () => {
  let listener: OrderConfirmedListener;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderConfirmedListener,
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    listener = module.get<OrderConfirmedListener>(OrderConfirmedListener);
  });

  it('should log that order is ready for shipping without throwing', () => {
    // Listener hiện chỉ log TODO GHN/GHTK — đảm bảo không crash khi nhận event
    expect(() => listener.handleOrderConfirmedEvent({ orderId: 'order-1' })).not.toThrow();
  });
});
