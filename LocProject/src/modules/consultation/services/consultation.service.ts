import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateConsultationLeadDto } from '../dto/consultation.dto';
import { getSlotsForDate, MAX_BOOKING_DAYS_AHEAD } from '../slot-config';

const ALLOWED_STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'CONVERTED', 'CANCELLED', 'CLOSED'];

@Injectable()
export class ConsultationService {
    constructor(private readonly prisma: PrismaService) { }

    /** Danh sách khung giờ khả dụng cho một ngày (public chỉ nhận từ hôm nay). */
    async getSlots(dateStr?: string) {
        const base = dateStr ? new Date(dateStr + 'T00:00:00.000Z') : new Date();
        const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
        const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

        if (start < today) {
            throw new BadRequestException('Không thể xem slot cho ngày trong quá khứ');
        }
        const horizon = new Date(today);
        horizon.setDate(today.getDate() + MAX_BOOKING_DAYS_AHEAD);
        if (start > horizon) {
            throw new BadRequestException(
                `Chỉ nhận đặt lịch tối đa ${MAX_BOOKING_DAYS_AHEAD} ngày kể từ hôm nay`,
            );
        }

        return {
            date: dateStr ?? undefined,
            preferredHours: getSlotsForDate(start),
        };
    }

    async create(dto: CreateConsultationLeadDto, customerId?: string) {
        const date = new Date(dto.preferredDate + 'T00:00:00.000Z');
        if (Number.isNaN(date.getTime())) {
            throw new BadRequestException('Ngày không hợp lệ');
        }

        const slots = getSlotsForDate(date);
        if (slots.length === 0) {
            throw new BadRequestException('Ngày này không nhận tư vấn (Chủ nhật nghỉ)');
        }
        const ok = slots.some((s) => s.label === dto.preferredTime);
        if (!ok) {
            throw new BadRequestException(
                `Khung giờ không hợp lệ. Hãy chọn: ${slots.map((s) => s.label).join(', ')}`,
            );
        }

        const preferredDate = new Date(dto.preferredDate + 'T00:00:00.000Z');

        return this.prisma.consultationLead.create({
            data: {
                fullName: dto.fullName,
                phone: dto.phone,
                email: dto.email,
                note: dto.note,
                productId: dto.productId,
                customerId: customerId ?? null,
                preferredDate,
                preferredTime: dto.preferredTime,
                status: 'NEW',
            },
        });
    }

    /** Danh sách yêu cầu tư vấn (admin) — sắp theo mới nhất, hỗ trợ filter theo trạng thái. */
    async findAll(params: { status?: string; page: number; limit: number }) {
        const { page, limit } = params;
        const where: Record<string, unknown> = {};
        if (params.status) {
            if (!ALLOWED_STATUSES.includes(params.status)) {
                throw new BadRequestException('Trạng thái không hợp lệ');
            }
            where.status = params.status;
        }
        const [data, total] = await Promise.all([
            this.prisma.consultationLead.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignee: { select: { id: true, fullName: true, email: true } },
                    customer: { select: { id: true, fullName: true, phone: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.consultationLead.count({ where }),
        ]);
        return { data, total, page, limit };
    }

    async findById(id: string) {
        const lead = await this.prisma.consultationLead.findUnique({
            where: { id },
            include: {
                assignee: { select: { id: true, fullName: true, email: true } },
                customer: { select: { id: true, fullName: true, phone: true } },
            },
        });
        if (!lead) {
            throw new NotFoundException('Yêu cầu tư vấn không tồn tại');
        }
        return lead;
    }

    /** Admin cập nhật trạng thái; CONFIRMED/CONVERTED ghi confirmedAt. */
    async updateStatus(id: string, status: string) {
        if (!ALLOWED_STATUSES.includes(status)) {
            throw new BadRequestException('Trạng thái không hợp lệ');
        }
        const lead = await this.prisma.consultationLead.findUnique({ where: { id } });
        if (!lead) {
            throw new NotFoundException('Không tìm thấy yêu cầu tư vấn');
        }
        const confirmed = status === 'CONFIRMED' || status === 'CONVERTED';
        return this.prisma.consultationLead.update({
            where: { id },
            data: {
                status: status as 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CONVERTED' | 'CANCELLED' | 'CLOSED',
                confirmedAt: confirmed ? new Date() : null,
            },
        });
    }

    async assign(id: string, assigneeId: string) {
        const lead = await this.prisma.consultationLead.findUnique({ where: { id } });
        if (!lead) {
            throw new NotFoundException('Không tìm thấy yêu cầu tư vấn');
        }
        return this.prisma.consultationLead.update({
            where: { id },
            data: { assignedTo: assigneeId },
        });
    }
}