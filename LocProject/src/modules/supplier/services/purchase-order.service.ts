import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { ReceiveItemsDto } from '../dto/receive-items.dto';
import { PurchaseOrderReceivedEvent } from '../events/purchase-order-received.event';
import { PurchaseOrderStatus } from '@prisma/client';

export interface POFilters {
    status?: PurchaseOrderStatus;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
}

@Injectable()
export class PurchaseOrderService {
    private readonly logger = new Logger(PurchaseOrderService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Generate poNumber format: PO-YYYYMMDD-XXX
     * Ví dụ: PO-20260715-001
     * Logic: đếm số PO trong ngày hôm nay, +1, pad thành 3 chữ số.
     */
    private async generatePoNumber(): Promise<string> {
        const now = new Date();
        const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const prefix = `PO-${yyyymmdd}-`;

        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const count = await this.prisma.purchaseOrder.count({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
            },
        });

        const seq = count + 1;
        return `${prefix}${String(seq).padStart(3, '0')}`;
    }

    async createPO(dto: CreatePurchaseOrderDto, userId: string) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id: dto.supplierId },
        });
        if (!supplier) {
            throw new NotFoundException('Không tìm thấy nhà cung cấp');
        }

        const poNumber = await this.generatePoNumber();

        const totalAmount = dto.items.reduce(
            (sum, item) => sum + item.qty * item.unitCost,
            0,
        );

        return this.prisma.purchaseOrder.create({
            data: {
                supplierId: dto.supplierId,
                poNumber,
                status: 'DRAFT',
                totalAmount,
                expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
                createdBy: userId,
                items: {
                    create: dto.items.map((item) => ({
                        productVariantId: item.productVariantId,
                        qty: item.qty,
                        unitCost: item.unitCost,
                    })),
                },
            },
            include: { items: true },
        });
    }

    async findAll(filters: POFilters = {}) {
        const where: any = {};

        if (filters.status) where.status = filters.status;
        if (filters.supplierId) where.supplierId = filters.supplierId;
        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
            if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
        }

        return this.prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: {
                    select: { name: true, phone: true },
                },
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                items: {
                    include: {
                        variant: {
                            select: { sku: true, name: true },
                        },
                    },
                },
            },
        });

        if (!po) {
            throw new NotFoundException('Không tìm thấy đơn đặt hàng');
        }

        return po;
    }

    /**
     * Chuyển trạng thái PO theo đúng flow, KHÔNG cho phép lùi:
     * DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED
     * (CANCELLED chỉ reachable từ DRAFT/ORDERED qua cancelPO)
     */
    async updateStatus(id: string, status: PurchaseOrderStatus) {
        const po = await this.findOne(id);

        const forwardFlow: PurchaseOrderStatus[] = [
            'DRAFT',
            'ORDERED',
            'PARTIALLY_RECEIVED',
            'RECEIVED',
        ];

        const currentIndex = forwardFlow.indexOf(po.status);
        const targetIndex = forwardFlow.indexOf(status);

        if (currentIndex === -1 || targetIndex === -1 || targetIndex <= currentIndex) {
            throw new BadRequestException(
                `Không thể chuyển trạng thái từ ${po.status} sang ${status}`,
            );
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Nhận hàng thực tế.
     * - Trong transaction: update status, tạo SupplierInvoice nếu RECEIVED
     * - SAU transaction: emit event 'purchase-order.received' (Warehouse lắng nghe để tăng tồn kho)
     * - TUYỆT ĐỐI không import InventoryService
     */
    async receiveItems(id: string, dto: ReceiveItemsDto) {
        const po = await this.findOne(id);

        if (po.status === 'CANCELLED' || po.status === 'RECEIVED') {
            throw new BadRequestException(
                `Không thể nhận hàng cho đơn ở trạng thái ${po.status}`,
            );
        }

        const totalOrdered = po.items.reduce((sum, item) => sum + item.qty, 0);
        const totalReceived = dto.items.reduce((sum, item) => sum + item.qty, 0);
        const willBeReceived = totalReceived >= totalOrdered;

        const newStatus: PurchaseOrderStatus = willBeReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

        await this.prisma.$transaction(async (tx) => {
            await tx.purchaseOrder.update({
                where: { id },
                data: { status: newStatus },
            });

            // Tạo SupplierInvoice tự động khi đã nhận đủ
            if (newStatus === 'RECEIVED') {
                const invoiceNumber = `INV-${po.poNumber}`;
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);

                await tx.supplierInvoice.create({
                    data: {
                        purchaseOrderId: id,
                        invoiceNumber,
                        amount: po.totalAmount,
                        dueDate,
                        status: 'unpaid',
                    },
                });
            }
        });

        // Emit SAU transaction để Warehouse tăng tồn kho
        this.eventEmitter.emit(
            'purchase-order.received',
            new PurchaseOrderReceivedEvent(
                id,
                dto.items.map((i) => ({
                    productVariantId: i.productVariantId,
                    warehouseId: i.warehouseId,
                    qty: i.qty,
                    unitCost: i.unitCost,
                })),
            ),
        );

        return this.findOne(id);
    }

    async cancelPO(id: string) {
        const po = await this.findOne(id);

        if (po.status !== 'DRAFT' && po.status !== 'ORDERED') {
            throw new BadRequestException(
                `Chỉ có thể hủy đơn ở trạng thái DRAFT hoặc ORDERED (hiện tại: ${po.status})`,
            );
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
}