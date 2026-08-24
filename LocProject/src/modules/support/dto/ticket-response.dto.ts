import { Expose, Type } from 'class-transformer';
import { TicketStatus } from '@prisma/client';

export class OrderRefDto {
  @Expose() id: string;
  @Expose() orderCode: string;
}

export class CustomerRefDto {
  @Expose() id: string;
  @Expose() fullName: string;
  @Expose() phone: string | null;
  @Expose() email: string | null;
}

export class UserRefDto {
  @Expose() id: string;
  @Expose() fullName: string;
  @Expose() email: string;
}

export class TicketResponseDto {
  @Expose() id: string;
  @Expose() fullName: string;
  @Expose() phone: string;
  @Expose() email: string | null;
  @Expose() subject: string;
  @Expose() message: string;
  @Expose() status: TicketStatus;
  @Expose() orderId: string | null;
  @Expose() customerId: string | null;
  @Expose() assignedTo: string | null;
  @Expose() resolvedAt: Date | null;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;

  @Expose() @Type(() => OrderRefDto) order: { id: string; orderCode: string } | null;
  @Expose() @Type(() => CustomerRefDto) customer: { id: string; fullName: string; phone: string | null; email: string | null } | null;
  @Expose() @Type(() => UserRefDto) assignee: { id: string; fullName: string; email: string } | null;
}

export class TicketListResponseDto {
  @Expose() data: TicketResponseDto[];
  @Expose() total: number;
  @Expose() page: number;
  @Expose() limit: number;
  @Expose() totalPages: number;
}