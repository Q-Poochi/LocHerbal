export class InventoryAllocationFailedEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
    public readonly variantId: string,
    public readonly failedItemIndex: number,
  ) { }
}
