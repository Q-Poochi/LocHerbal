import { Test, TestingModule } from '@nestjs/testing';
import { PaymentConfirmedListener } from '../listeners/payment-confirmed.listener';
import { InvoiceService } from '../services/invoice.service';

describe('PaymentConfirmedListener (accounting → create invoice)', () => {
  let listener: PaymentConfirmedListener;
  let invoiceService: InvoiceService;

  const mockInvoiceService = {
    createFromOrder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentConfirmedListener,
        { provide: InvoiceService, useValue: mockInvoiceService },
      ],
    }).compile();

    listener = module.get<PaymentConfirmedListener>(PaymentConfirmedListener);
    invoiceService = module.get<InvoiceService>(InvoiceService);
  });

  it('should create invoice from order when payment confirmed', async () => {
    mockInvoiceService.createFromOrder.mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-001' });

    await listener.handlePaymentConfirmed({ orderId: 'order-1' });

    expect(mockInvoiceService.createFromOrder).toHaveBeenCalledWith('order-1');
  });

  it('should not throw when invoice creation fails (does not block event chain)', async () => {
    mockInvoiceService.createFromOrder.mockRejectedValue(new Error('invoice exists'));

    await expect(listener.handlePaymentConfirmed({ orderId: 'order-1' })).resolves.toBeUndefined();
  });
});
