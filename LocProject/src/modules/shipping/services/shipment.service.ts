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