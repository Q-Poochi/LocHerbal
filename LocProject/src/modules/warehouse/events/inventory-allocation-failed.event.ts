export class InventoryAllocationFailedEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
  ) {}
}
