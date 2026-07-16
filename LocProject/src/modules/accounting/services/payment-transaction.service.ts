import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentTransactionService {
    constructor(private readonly prisma: PrismaService) { }

    async record(data: {
        orderId: string;
        provider: string;
        transactionCode: string;
        amount: number;
        status: PaymentStatus;
        rawResponse?: any;
    }) {
        return this.prisma.paymentTransaction.create({
            data: {
                orderId: data.orderId,
                provider: data.provider,
                transactionCode: data.transactionCode,
                amount: data.amount,
                status: data.status,
                rawResponse: data.rawResponse,
            },
        });
    }

    async findByOrderId(orderId: string) {
        const transactions = await this.prisma.paymentTransaction.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        });
        return transactions;
    }
}