export class PaymentConfirmedEvent {
  constructor(
    public readonly orderId: string,
    public readonly items: { productVariantId: string; qty: number }[],
  ) {}
}
