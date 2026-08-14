import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Public } from '../../core/decorators/public.decorator';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { AddCartItemDto, UpdateCartItemDto } from '../dto/cart.dto';
import { CheckoutDto } from '../dto/order.dto';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
    constructor(
        private readonly cartService: CartService,
        private readonly orderService: OrderService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Lấy giỏ hàng.
     * Guest: dùng ?sessionId=xxx
     * Logged-in: JWT tự động gắn, dùng customerId từ JWT claims
     */
    @Get()
    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    async getCart(
        @Query('sessionId') sessionId: string | undefined,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        return this.cartService.getOrCreateCart(customerId, sessionId);
    }

    /**
     * Thêm item vào giỏ hàng. Tự động tạo cart nếu chưa có.
     */
    @Post('items')
    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    async addItem(
        @Body() body: AddCartItemDto,
        @Query('sessionId') sessionId: string | undefined,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        return this.cartService.addToCart(customerId, sessionId, body.productVariantId, body.qty);
    }

    /**
     * Cập nhật số lượng item.
     * Xoá item cũ, thêm lại với qty mới (vì CartService.addToCart cộng dồn).
     */
    @Patch('items/:variantId')
    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    async updateItem(
        @Param('variantId') variantId: string,
        @Body() body: UpdateCartItemDto,
        @Query('sessionId') sessionId: string | undefined,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        const cart = await this.cartService.getOrCreateCart(customerId, sessionId);
        await this.cartService.removeItemByVariantId(cart.id, variantId);
        return this.cartService.addToCart(customerId, sessionId, variantId, body.qty);
    }

    /**
     * Xóa item khỏi giỏ.
     */
    @Delete('items/:variantId')
    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    async removeItem(
        @Param('variantId') variantId: string,
        @Query('sessionId') sessionId: string | undefined,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        const cart = await this.cartService.getOrCreateCart(customerId, sessionId);
        return this.cartService.removeItemByVariantId(cart.id, variantId);
    }

    /**
     * Checkout — tạo order từ giỏ hàng. Yêu cầu đăng nhập.
     */
    @Post('checkout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thanh toán giỏ hàng — tạo đơn hàng mới' })
    @ApiResponse({ status: 201, description: 'Tạo đơn hàng thành công', schema: { example: { id: 'order-uuid', orderCode: 'LH-2026-000001', status: 'PENDING', paymentStatus: 'UNPAID', subtotal: 450000, shippingFee: 30000, totalAmount: 480000, customerId: 'customer-uuid', createdAt: '2026-08-07T00:00:00.000Z' } } })
    @ApiResponse({ status: 401, description: 'Yêu cầu đăng nhập để thanh toán' })
    async checkout(
        @Body() body: CheckoutDto,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        if (!customerId) {
            throw new UnauthorizedException('Yêu cầu đăng nhập để thanh toán');
        }
        const cart = await this.cartService.getOrCreateCart(customerId);
        return this.orderService.checkout({
            cartId: cart.id,
            customerId,
            body,
        });
    }

    /**
     * Lấy customerId thực tế (Customer.id) từ JWT.
     * JWT strategy set (req as any).user = { userId: payload.sub } (payload.sub = User.id).
     * Cart.customerId / Order.customerId là FK tới Customer.id, không phải User.id,
     * nên phải resolve qua bảng Customer (userId -> id).
     * Tự động tạo Customer record nếu user chưa có (tránh lỗi 500 khi getOrCreateCart nhận undefined).
     */
    private async getCustomerId(req: Request): Promise<string | undefined> {
        const userId = (req as any).user?.userId;
        if (!userId) return undefined;

        let customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!customer) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { fullName: true, email: true },
            });
            customer = await this.prisma.customer.create({
                data: { userId, fullName: user?.fullName || user?.email || 'User' },
                select: { id: true },
            });
        }

        return customer.id;
    }
}
