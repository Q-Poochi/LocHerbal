/**
 * Phát ra khi nhận hàng thực tế xong từ 1 PurchaseOrder.
 * Warehouse lắng nghe event này để tăng qty_on_hand (KHÔNG gọi
 * WarehouseService trực tiếp — đúng rule Domain Event).
 */
export class PurchaseOrderReceivedEvent {
    constructor(
        public readonly orderId: string,
        public readonly items: Array<{
            productVariantId: string;
            warehouseId: string;
            qty: number;
            unitCost: number;
        }>,
    ) { }
}