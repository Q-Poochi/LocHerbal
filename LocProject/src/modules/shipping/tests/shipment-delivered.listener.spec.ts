import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentDeliveredListener } from '../listeners/shipment-delivered.listener';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('ShipmentDeliveredListener (auto DELIVERED)', () => {
  let listener: ShipmentDeliveredListener;
  let prisma: PrismaService;

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentDeliveredListener,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    listener = module.get<ShipmentDeliveredListener>(ShipmentDeliveredListener);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should auto-mark order DELIVERED when shipment delivered and order in shippable state', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'SHIPPED' });
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb({
      order: { update: jest.fn().mockResolvedValue({ id: 'order-1', status: 'DELIVERED' }) },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({ id: 'h-1' }) },
    }));

    await listener.handleShipmentDelivered({ shipmentId: 'ship-1', orderId: 'order-1' });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('should do nothing when order already DELIVERED (idempotent)', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'DELIVERED' });

    await listener.handleShipmentDelivered({ shipmentId: 'ship-1', orderId: 'order-1' });

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('should do nothing when order in non-shippable state', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' });

    await listener.handleShipmentDelivered({ shipmentId: 'ship-1', orderId: 'order-1' });

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('should not throw when order not found', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null);

    await expect(
      listener.handleShipmentDelivered({ shipmentId: 'ship-1', orderId: 'nope' }),
    ).resolves.toBeUndefined();
  });
});
