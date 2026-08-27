import { sanitizeInput } from '../../../shared/utils/sanitize.util';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketQueryDto } from '../dto/ticket-query.dto';
import { TicketStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(dto: CreateTicketDto, customerId?: string) {
    // Validate orderId if provided
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { id: true },
      });
      if (!order) {
        throw new BadRequestException('Đơn hàng không tồn tại');
      }
    }

    // Validate customerId if provided (for logged-in users)
    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true },
      });
      if (!customer) {
        throw new BadRequestException('Khách hàng không tồn tại');
      }
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        fullName: sanitizeInput(dto.fullName),
        phone: dto.phone,
        email: dto.email,
        subject: sanitizeInput(dto.subject),
        message: sanitizeInput(dto.message),
        orderId: dto.orderId,
        customerId,
        status: TicketStatus.NEW,
      },
      include: {
        order: { select: { id: true, orderCode: true } },
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.mapTicketToResponse(ticket);
  }

  async getTickets(query: TicketQueryDto) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderCode: true } },
          customer: { select: { id: true, fullName: true, phone: true, email: true } },
          assignee: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets.map(this.mapTicketToResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTicketById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderCode: true } },
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket không tồn tại');
    }

    return this.mapTicketToResponse(ticket);
  }

  async updateTicket(id: string, dto: UpdateTicketDto) {
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Ticket không tồn tại');
    }

    const updateData: Prisma.SupportTicketUpdateInput = {};

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }
    }

    if (dto.assignedTo !== undefined) {
      // Verify assignee exists if provided
      if (dto.assignedTo) {
        const user = await this.prisma.user.findUnique({
          where: { id: dto.assignedTo },
          select: { id: true },
        });
        if (!user) {
          throw new BadRequestException('Nhân viên không tồn tại');
        }
      }
      updateData.assignee = dto.assignedTo ? { connect: { id: dto.assignedTo } } : { disconnect: true };
    }

    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        order: { select: { id: true, orderCode: true } },
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.mapTicketToResponse(ticket);
  }

  private mapTicketToResponse(ticket: any) {
    return {
      id: ticket.id,
      fullName: ticket.fullName,
      phone: ticket.phone,
      email: ticket.email,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      orderId: ticket.orderId,
      customerId: ticket.customerId,
      assignedTo: ticket.assignedTo,
      resolvedAt: ticket.resolvedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      order: ticket.order ? { id: ticket.order.id, orderCode: ticket.order.orderCode } : null,
      customer: ticket.customer ? {
        id: ticket.customer.id,
        fullName: ticket.customer.fullName,
        phone: ticket.customer.phone,
        email: ticket.customer.email,
      } : null,
      assignee: ticket.assignee ? {
        id: ticket.assignee.id,
        fullName: ticket.assignee.fullName,
        email: ticket.assignee.email,
      } : null,
    };
  }
}