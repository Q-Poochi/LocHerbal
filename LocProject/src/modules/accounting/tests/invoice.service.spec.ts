import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from '../services/invoice.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('InvoiceService', () => {
    let service: InvoiceService;
    let prisma: PrismaService;

    const mockPrisma = {
        order: {
            findUnique: jest.fn(),
        },
        invoice: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InvoiceService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<InvoiceService>(InvoiceService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create invoice from order successfully', async () => {
        const order = { id: 'order-1', totalAmount: 100000 };
        mockPrisma.order.findUnique.mockResolvedValue(order);
        mockPrisma.invoice.findUnique.mockResolvedValue(null);
        mockPrisma.invoice.count.mockResolvedValue(0);
        const createdInvoice = {
            id: 'inv-1',
            orderId: 'order-1',
            invoiceNumber: 'INV-20240101-0001',
            totalAmount: 100000,
            taxAmount: 0,
            order,
        };
        mockPrisma.invoice.create.mockResolvedValue(createdInvoice);

        const result = await service.createFromOrder('order-1');
        expect(result).toEqual(createdInvoice);
        expect(prisma.invoice.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
        mockPrisma.order.findUnique.mockResolvedValue(null);

        await expect(service.createFromOrder('order-999')).rejects.toThrow('Đơn hàng không tồn tại');
    });

    it('should throw BadRequestException if invoice already exists (idempotent)', async () => {
        const order = { id: 'order-1', totalAmount: 100000 };
        mockPrisma.order.findUnique.mockResolvedValue(order);
        mockPrisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', orderId: 'order-1' });

        await expect(service.createFromOrder('order-1')).rejects.toThrow('Invoice đã tồn tại cho đơn hàng này');
    });

    it('should find invoice by orderId', async () => {
        const invoice = { id: 'inv-1', orderId: 'order-1', order: { id: 'order-1' } };
        mockPrisma.invoice.findUnique.mockResolvedValue(invoice);

        const result = await service.findByOrderId('order-1');
        expect(result).toEqual(invoice);
    });

    it('should throw NotFoundException when invoice not found by orderId', async () => {
        mockPrisma.invoice.findUnique.mockResolvedValue(null);

        await expect(service.findByOrderId('order-999')).rejects.toThrow('Invoice không tồn tại');
    });

    it('should generate invoice number in correct format', async () => {
        const order = { id: 'order-1', totalAmount: 100000 };
        mockPrisma.order.findUnique.mockResolvedValue(order);
        mockPrisma.invoice.findUnique.mockResolvedValue(null);
        mockPrisma.invoice.count.mockResolvedValue(5);
        const createdInvoice = {
            id: 'inv-1',
            orderId: 'order-1',
            invoiceNumber: 'INV-20240101-0006',
            totalAmount: 100000,
            taxAmount: 0,
        };
        mockPrisma.invoice.create.mockResolvedValue(createdInvoice);

        const result = await service.createFromOrder('order-1');
        expect(result.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    });

    it('should return paginated invoices', async () => {
        const invoices = [
            { id: 'inv-1', orderId: 'order-1' },
            { id: 'inv-2', orderId: 'order-2' },
        ];
        mockPrisma.invoice.findMany.mockResolvedValue(invoices);
        mockPrisma.invoice.count.mockResolvedValue(2);

        const result = await service.findAll(1, 20);
        expect(result.data).toEqual(invoices);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
    });
});