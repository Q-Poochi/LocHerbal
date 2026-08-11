import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async create(dto: CreateShipmentDto) {
        const existing = await this.prisma.shipment.findUnique({
            where: { orderId: dto.orderId },
        });
        if (existing) {
            throw new BadRequestException('Đơn hàng này đã có shipment');
        }

        const carrier = await this.prisma.carrier.findUnique({
            where: { id: dto.carrierId },
        });
        if (!carrier) {
            throw new NotFoundException('Không tìm thấy nhà vận chuyển');
        }

        return this.prisma.shipment.create({
            data: {
                orderId: dto.orderId,
                carrierId: dto.carrierId,
                shippingFee: dto.shippingFee,
                estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
                status: ShipmentStatus.PENDING,
            },
        });
    }

    async updateStatus(id: string, status: ShipmentStatus, note?: string) {
        const current = await this.prisma.shipment.findUnique({
            where: { id },
        });
        if (!current) {
            throw new NotFoundException('Không tìm thấy shipment');
        }

        const flow: ShipmentStatus[] = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
        const currentIndex = flow.indexOf(current.status);
        const targetIndex = flow.indexOf(status);

        if (currentIndex === -1 || targetIndex === -1 || targetIndex <= currentIndex) {
            throw new BadRequestException(
                `Không thể chuyển trạng thái từ ${current.status} sang ${status}`,
            );
        }

        const updated = await this.prisma.shipment.update({
            where: { id },
            data: { status },
        });

        if (status === 'DELIVERED') {
            this.eventEmitter.emit('shipment.delivered', { shipmentId: id, orderId: current.orderId });
        }

        return updated;
    }

    async addTrackingEvent(shipmentId: string, dto: any) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id: shipmentId },
        });
        if (!shipment) {
            throw new NotFoundException('Không tìm thấy shipment');
        }

        return this.prisma.shipmentTrackingEvent.create({
            data: {
                shipmentId,
                status: dto.status,
                description: dto.description,
                occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
            },
        });
    }

    /**
     * Áp dụng trạng thái từ webhook nhà vận chuyển (GHN/GHTK).
     * Khác updateStatus (yêu cầu tiến tuần tự qua flow), method này:
     *  - idempotent: nếu status mới TRÙNG hoặc KHÔNG phải transition hợp lệ → bỏ qua
     *    (GHN retry tối đa 10 lần — không được trả 400/500, tránh vòng lặp retry).
     *  - chấp nhận FAILED / RETURNED là status cuối (enum có nhưng updateStatus bỏ qua).
     */
    async applyCarrierStatus(shipmentId: string, status: ShipmentStatus, description?: string) {
        const current = await this.prisma.shipment.findUnique({
            where: { id: shipmentId },
        });
        if (!current) {
            throw new NotFoundException('Không tìm thấy shipment');
        }

        // Đã ở status cuối (DELIVERED/FAILED/RETURNED) — không cho ghi đè ngược.
        if (current.status === status) {
            return { shipmentId, applied: false, status: current.status, reason: 'already_at_status' };
        }

        const terminal: ShipmentStatus[] = ['DELIVERED', 'FAILED', 'RETURNED'];
        const flow: ShipmentStatus[] = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

        // current đã terminal → không cho regress
        if (terminal.includes(current.status)) {
            return { shipmentId, applied: false, status: current.status, reason: 'terminal_lock' };
        }

        // target terminal → cho phép set thẳng (dù PENDING → DELIVERED qua webhook)
        if (terminal.includes(status)) {
            const updated = await this.prisma.shipment.update({
                where: { id: shipmentId },
                data: { status },
            });

            if (description) {
                await this.addTrackingEvent(shipmentId, { status, description });
            }

            if (status === 'DELIVERED') {
                this.eventEmitter.emit('shipment.delivered', {
                    shipmentId,
                    orderId: current.orderId,
                });
            }

            return { shipmentId, applied: true, status };
        }

        // target trong flow (PICKED_UP / IN_TRANSIT): chỉ cho tiến tuần tự
        const currentIndex = flow.indexOf(current.status);
        const targetIndex = flow.indexOf(status);
        if (currentIndex === -1 || targetIndex === -1 || targetIndex <= currentIndex) {
            return { shipmentId, applied: false, status: current.status, reason: 'invalid_transition' };
        }

        const updated = await this.prisma.shipment.update({
            where: { id: shipmentId },
            data: { status },
        });

        if (description) {
            await this.addTrackingEvent(shipmentId, { status, description });
        }

        return { shipmentId, applied: true, status };
    }

    async findByOrder(orderId: string) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { orderId },
            include: {
                carrier: true,
                events: {
                    orderBy: { occurredAt: 'desc' },
                },
            },
        });
        return shipment;
    }
}