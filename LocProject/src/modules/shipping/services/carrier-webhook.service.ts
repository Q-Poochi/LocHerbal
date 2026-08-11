import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ShipmentService } from './shipment.service';

/**
 * Xử lý webhook inbound từ nhà vận chuyển (GHN / GHTK).
 *
 * GHN  — POST JSON tới URL callback, retry tối đa 10 lần (5s/lần) nếu không 200.
 *        Status enum: ready_to_pick, picking, picked, storing, transporting,
 *        sorting, delivering, delivered, delivery_fail, waiting_to_return,
 *        return, returned, cancel, money_collect_*.
 * GHTK — POST (JSON hoặc form-urlencoded) tới URL callback dạng ?hash=<token>,
 *        retry khi response != 200. Status: status_id int (1..21).
 *
 * Cả hai đều KHÔNG có checksum chữ ký riêng — xác thực dựa trên secret token
 * đặt trong URL/query (chuẩn do nhà vận chuyển khuyến nghị).
 */
@Injectable()
export class CarrierWebhookService {
    private readonly logger = new Logger(CarrierWebhookService.name);

    // GHN status → ShipmentStatus nội bộ
    private readonly GHN_STATUS_MAP: Record<string, ShipmentStatus> = {
        ready_to_pick: ShipmentStatus.PENDING,
        picking: ShipmentStatus.PICKED_UP,
        money_collect_picking: ShipmentStatus.PICKED_UP,
        picked: ShipmentStatus.PICKED_UP,
        storing: ShipmentStatus.IN_TRANSIT,
        transporting: ShipmentStatus.IN_TRANSIT,
        sorting: ShipmentStatus.IN_TRANSIT,
        delivering: ShipmentStatus.IN_TRANSIT,
        money_collect_delivering: ShipmentStatus.IN_TRANSIT,
        delivered: ShipmentStatus.DELIVERED,
        delivery_fail: ShipmentStatus.FAILED,
        waiting_to_return: ShipmentStatus.RETURNED,
        return: ShipmentStatus.RETURNED,
        returned: ShipmentStatus.RETURNED,
        cancel: ShipmentStatus.FAILED,
    };

    // GHTK status_id → ShipmentStatus nội bộ
    private readonly GHTK_STATUS_MAP: Record<string, ShipmentStatus> = {
        '-1': ShipmentStatus.FAILED,      // Hủy đơn
        '1': ShipmentStatus.PENDING,      // Chưa tiếp nhận
        '2': ShipmentStatus.PENDING,      // Đã tiếp nhận
        '3': ShipmentStatus.PICKED_UP,    // Đã lấy hàng / đã nhập kho
        '4': ShipmentStatus.IN_TRANSIT,   // Đang giao
        '5': ShipmentStatus.DELIVERED,    // Đã giao (chưa đối soát)
        '6': ShipmentStatus.DELIVERED,    // Đã đối soát
        '7': ShipmentStatus.FAILED,       // Không lấy được hàng
        '8': ShipmentStatus.PENDING,      // Hoãn lấy hàng
        '9': ShipmentStatus.FAILED,       // Không giao được hàng
        '10': ShipmentStatus.IN_TRANSIT,  // Delay giao hàng
        '11': ShipmentStatus.RETURNED,    // Đã đối soát công nợ trả hàng
        '12': ShipmentStatus.PICKED_UP,   // Đang lấy hàng
        '13': ShipmentStatus.FAILED,      // Đơn bồi hoàn
        '20': ShipmentStatus.RETURNED,    // Đang trả hàng
        '21': ShipmentStatus.RETURNED,    // Đã trả hàng
        '30': ShipmentStatus.IN_TRANSIT,  // Đến trung chuyển
        '31': ShipmentStatus.IN_TRANSIT,  // Rời trung chuyển
        '91': ShipmentStatus.IN_TRANSIT,  // Đến kho đích
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly shipmentService: ShipmentService,
    ) { }

    /**
     * So sánh token an toàn (constant-time). Nếu token không được cấu hình
     * (empty) → từ chối mọi request (fail-closed).
     */
    private verifyToken(expected: string | undefined, received: string | undefined): boolean {
        if (!expected || !received) return false;
        const a = Buffer.from(expected);
        const b = Buffer.from(received);
        return a.length === b.length && timingSafeEqual(a, b);
    }

    /** GHN: POST JSON { OrderCode, Status, Time, Description, ... } */
    async handleGhn(payload: any, token?: string) {
        if (!this.verifyToken(process.env.GHN_WEBHOOK_TOKEN, token)) {
            throw new UnauthorizedException('Webhook token không hợp lệ');
        }

        const orderCode = payload?.OrderCode ?? payload?.order_code;
        const clientOrderCode = payload?.ClientOrderCode ?? payload?.client_order_code;
        const ghnStatus = payload?.Status ?? payload?.status;
        const time = payload?.Time ?? payload?.time;
        const description = payload?.Description ?? payload?.description;

        const status = ghnStatus ? this.GHN_STATUS_MAP[ghnStatus] : undefined;
        if (!status) {
            this.logger.warn(`GHN webhook: bỏ qua status không map được: ${ghnStatus}`);
            return { received: true, ignored: true, reason: 'unknown_status' };
        }

        const applied = await this.applyToShipment({
            trackingCode: orderCode,
            orderId: clientOrderCode,
            status,
            description: description || `GHN: ${ghnStatus}`,
            occurredAt: time,
            provider: 'GHN',
        });

        // GHN retry 10 lần nếu không 200 — trả 200 kể cả khi shipment chưa tồn tại
        return { received: true, ignored: !applied };
    }

    /** GHTK: POST JSON/form { partner_id, label_id, status_id, action_time, reason } */
    async handleGhtk(payload: any, token?: string) {
        if (!this.verifyToken(process.env.GHTK_WEBHOOK_TOKEN, token)) {
            throw new UnauthorizedException('Webhook token không hợp lệ');
        }

        const labelId = payload?.label_id;
        const partnerId = payload?.partner_id;
        const statusId = String(payload?.status_id ?? '');
        const actionTime = payload?.action_time;
        const reason = payload?.reason;

        const status = statusId ? this.GHTK_STATUS_MAP[statusId] : undefined;
        if (!status) {
            this.logger.warn(`GHTK webhook: bỏ qua status_id không map được: ${statusId}`);
            return { received: true, ignored: true, reason: 'unknown_status' };
        }

        const applied = await this.applyToShipment({
            trackingCode: labelId,
            orderId: partnerId,
            status,
            description: reason || `GHTK: status ${statusId}`,
            occurredAt: actionTime,
            provider: 'GHTK',
        });

        // GHTK retry khi không 200 — trả 200 kể cả khi shipment chưa tồn tại
        return { received: true, ignored: !applied };
    }

    /**
     * Tìm shipment theo mã vận đơn (trackingCode) hoặc mã đơn nội bộ (orderId)
     * rồi áp dụng trạng thái. Idempotent: transition không hợp lệ → bỏ qua.
     */
    private async applyToShipment(args: {
        trackingCode?: string;
        orderId?: string;
        status: ShipmentStatus;
        description: string;
        occurredAt?: string;
        provider: string;
    }) {
        if (!args.trackingCode && !args.orderId) {
            this.logger.warn(`${args.provider} webhook: thiếu mã vận đơn lẫn mã đơn`);
            return false;
        }

        const shipment = await this.prisma.shipment.findFirst({
            where: {
                OR: [
                    ...(args.trackingCode ? [{ trackingCode: args.trackingCode }] : []),
                    ...(args.orderId ? [{ orderId: args.orderId }] : []),
                ],
            },
        });

        if (!shipment) {
            this.logger.warn(
                `${args.provider} webhook: không tìm thấy shipment cho tracking=${args.trackingCode} order=${args.orderId}`,
            );
            return false;
        }

        const description = args.occurredAt
            ? `${args.description} @ ${args.occurredAt}`
            : args.description;

        await this.shipmentService.applyCarrierStatus(shipment.id, args.status, description);
        return true;
    }
}
