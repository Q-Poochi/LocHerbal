import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ShipmentDeliveredListener {
    private readonly logger = new Logger(ShipmentDeliveredListener.name);

    constructor(private readonly prisma: PrismaService) { }

    @OnEvent('shipment.delivered')
    async handleShipmentDelivered(event: { shipmentId: string; orderId: string }) {
        const order = await this.prisma.order.findUnique({
            where: { id: event.orderId },
        });

        if (!order) {
            this.logger.warn(`Shipment delivered but order not found: ${event.orderId}`);
            return;
        }

        // Idempotent + chỉ tự động DELIVERED khi đơn đang ở trạng thái giao được
        const allowed: OrderStatus[] = [
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
        ];
        if (order.status === OrderStatus.DELIVERED) {
            return;
        }
        if (!allowed.includes(order.status)) {
            this.logger.warn(
                `Shipment delivered nhưng đơn ${event.orderId} đang ở trạng thái ${order.status}, không tự chuyển DELIVERED`,
            );
            return;
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: event.orderId },
                data: { status: OrderStatus.DELIVERED },
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId: event.orderId,
                    status: OrderStatus.DELIVERED,
                    note: `Giao hàng thành công (shipment ${event.shipmentId})`,
                    changedBy: 'SHIPPING_SYSTEM',
                },
            });
        });

        this.logger.log(`Order ${event.orderId} auto-marked DELIVERED via shipment ${event.shipmentId}`);
    }
}
