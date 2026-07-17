import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrderConfirmedListener {
    private readonly logger = new Logger(OrderConfirmedListener.name);

    constructor(private readonly eventEmitter: EventEmitter2) { }

    @OnEvent('order.confirmed')
    handleOrderConfirmedEvent(event: { orderId: string }) {
        this.logger.log(`Order confirmed, ready for shipping: ${event.orderId}`);
        // TODO: Tích hợp GHN/GHTK API để tạo vận đơn tự động
    }
}
