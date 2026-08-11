import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderReceivedListener } from '../listeners/purchase-order-received.listener';
import { InventoryService } from '../services/inventory.service';
import { PurchaseOrderReceivedEvent } from '../../supplier/events/purchase-order-received.event';

describe('PurchaseOrderReceivedListener', () => {
  let listener: PurchaseOrderReceivedListener;
  let inventoryService: InventoryService;

  const mockInventory = {
    inbound: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderReceivedListener,
        { provide: InventoryService, useValue: mockInventory },
      ],
    }).compile();

    listener = module.get<PurchaseOrderReceivedListener>(PurchaseOrderReceivedListener);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  it('should inbound all items to warehouse', async () => {
    const event = new PurchaseOrderReceivedEvent('po-1', [
      { productVariantId: 'v-1', warehouseId: 'w-1', qty: 10, unitCost: 100 },
      { productVariantId: 'v-2', warehouseId: 'w-1', qty: 5, unitCost: 200 },
    ]);
    mockInventory.inbound.mockResolvedValue(undefined);

    await listener.handle(event);

    expect(mockInventory.inbound).toHaveBeenCalledTimes(2);
    expect(mockInventory.inbound).toHaveBeenCalledWith('v-1', 'w-1', 10, 'po-1');
    expect(mockInventory.inbound).toHaveBeenCalledWith('v-2', 'w-1', 5, 'po-1');
  });
});
