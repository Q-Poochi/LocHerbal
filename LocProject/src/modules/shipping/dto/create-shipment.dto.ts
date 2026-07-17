export class CreateShipmentDto {
    orderId: string;
    carrierId: string;
    shippingFee: number;
    estimatedDelivery?: string;
}