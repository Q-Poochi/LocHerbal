import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';

/**
 * E2E saga — chuỗi thật: checkout → order.created → allocate →
 * payment.confirmed → deduct → shipment.delivered → DELIVERED.
 *
 * Chạy với DATABASE_URL trỏ DB test (ecommerce_test). Trước khi chạy:
 *   docker exec postgres-primary createdb ecommerce_test
 *   DATABASE_URL=... npx prisma migrate deploy
 */
describe('E2E: Order saga (checkout → allocate → deduct → delivered)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allocate stock on checkout, deduct on payment, DELIVERED on shipment', async () => {
    // ── Setup data test ──────────────────────────────────────────────
    const warehouse = await prisma.warehouse.create({
      data: { name: 'E2E Kho', isActive: true },
    });

    const category = await prisma.category.create({
      data: {
        name: 'E2E Category',
        slug: `e2e-cat-${Date.now()}`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: 'E2E Product',
        slug: `e2e-prod-${Date.now()}`,
        description: 'E2E',
        categoryId: category.id,
        isPublished: true,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `E2E-SKU-${Date.now()}`,
        name: 'E2E Variant',
        price: 100000,
      },
    });

    const stockItem = await prisma.stockItem.create({
      data: {
        warehouseId: warehouse.id,
        productVariantId: variant.id,
        qtyOnHand: 50,
        qtyReserved: 0,
      },
    });

    const customer = await prisma.customer.create({
      data: { fullName: 'E2E Customer', phone: `090${Date.now() % 100000000}` },
    });

    const address = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        recipientName: 'E2E Customer',
        phone: `090${Date.now() % 100000000}`,
        addressLine: '123 E2E St',
        province: 'Hanoi',
        isDefault: true,
      },
    });

    const cart = await prisma.cart.create({
      data: { customerId: customer.id },
    });

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productVariantId: variant.id,
        qty: 2,
        priceSnapshot: 100000,
      },
    });

    // ── 1. Checkout qua OrderService (qua controller path không cần auth trước) ──
    const { OrderService } = await import('../src/modules/sales/services/order.service');
    const orderService = app.get(OrderService);
    const order = await orderService.checkout(cart.id, customer.id, address.id);

    expect(order.status).toBe('PENDING');
    expect(Number(order.totalAmount)).toBe(200000);

    // ── 2. Assert: stock đã được allocate (qtyReserved = 2) ──
    //    Vì checkout dùng emitAsync, allocate phải hoàn tất TRƯỚC khi return.
    const afterCheckout = await prisma.stockItem.findUnique({ where: { id: stockItem.id } });
    expect(afterCheckout.qtyReserved).toBe(2);
    expect(afterCheckout.qtyOnHand).toBe(50);

    // ── 3. Payment.confirmed (mô phỏng IPN thành công) → deduct ──
    const { VNPayService } = await import('../src/modules/sales/services/vnpay.service');
    const vnpay = app.get(VNPayService);
    // Gọi trực tiếp listener deduct thông qua event bus (mô phỏng IPN).
    const { EventEmitter2 } = await import('@nestjs/event-emitter');
    const emitter = app.get(EventEmitter2);
    emitter.emit('payment.confirmed', {
      orderId: order.id,
      items: [{ productVariantId: variant.id, qty: 2 }],
    });

    // Chờ deduct async hoàn tất (listener chạy trong event loop)
    await new Promise((r) => setTimeout(r, 500));

    const afterDeduct = await prisma.stockItem.findUnique({ where: { id: stockItem.id } });
    expect(afterDeduct.qtyOnHand).toBe(48);
    expect(afterDeduct.qtyReserved).toBe(0);

    // ── 4. VNPay IPN set order CONFIRMED (như luồng thật trước khi giao) ──
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
    });

    // ── 5. Shipment delivered → order DELIVERED ──
    const carrier = await prisma.carrier.create({
      data: { name: 'E2E Carrier', code: `E2E-${Date.now()}`, isActive: true },
    });

    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        carrierId: carrier.id,
        status: 'PENDING',
        trackingCode: `E2E-${Date.now()}`,
      },
    });

    const { ShipmentService } = await import('../src/modules/shipping/services/shipment.service');
    const shipmentService = app.get(ShipmentService);
    await shipmentService.updateStatus(shipment.id, 'DELIVERED');

    await new Promise((r) => setTimeout(r, 500));

    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(finalOrder.status).toBe('DELIVERED');

    // ── Cleanup ──
    await prisma.invoice.deleteMany({ where: { orderId: order.id } });
    await prisma.shipment.delete({ where: { id: shipment.id } });
    await prisma.carrier.delete({ where: { id: carrier.id } });
    await prisma.stockMovement.deleteMany({ where: { referenceId: order.id } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
    await prisma.paymentTransaction.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });
    await prisma.customerAddress.delete({ where: { id: address.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    await prisma.stockItem.delete({ where: { id: stockItem.id } });
    await prisma.productVariant.delete({ where: { id: variant.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.category.delete({ where: { id: category.id } });
    await prisma.warehouse.delete({ where: { id: warehouse.id } });
  });
});
