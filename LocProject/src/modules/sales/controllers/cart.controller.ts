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
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { AddCartItemDto, UpdateCartItemDto } from '../dto/cart.dto';
import { PrismaService } from '../../../shared/prisma/prisma.service';

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
    async addItem(
        @Body() body: AddCartItemDto,
        @Query('sessionId') sessionId: string | undefined,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        const cart = await this.cartService.getOrCreateCart(customerId, sessionId);
        return this.cartService.addToCart(cart.id, body.productVariantId, body.qty);
    }

    /**
     * Cập nhật số lượng item.
     * Xoá item cũ, thêm lại với qty mới (vì CartService.addToCart cộng dồn).
     */
    @Patch('items/:variantId')
    async updateItem(
        @Param('variantId') variantId: string,
        @Body() body: UpdateCartItemDto,
        @Query('sessionId') sessionId: string | undefined,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        const cart = await this.cartService.getOrCreateCart(customerId, sessionId);
        await this.cartService.removeItem(cart.id, variantId);
        return this.cartService.addToCart(cart.id, variantId, body.qty);
    }

    /**
     * Xóa item khỏi giỏ.
     */
    @Delete('items/:variantId')
    async removeItem(
        @Param('variantId') variantId: string,
        @Query('sessionId') sessionId: string | undefined,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        const cart = await this.cartService.getOrCreateCart(customerId, sessionId);
        return this.cartService.removeItem(cart.id, variantId);
    }

    /**
     * Checkout — tạo order từ giỏ hàng. Yêu cầu đăng nhập.
     */
    @Post('checkout')
    @UseGuards(JwtAuthGuard)
    async checkout(
        @Body('addressId') addressId: string | undefined,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        if (!customerId) {
            throw new UnauthorizedException('Yêu cầu đăng nhập để thanh toán');
        }
        const cart = await this.cartService.getOrCreateCart(customerId);
        return this.orderService.checkout(cart.id, customerId, addressId);
    }

    /**
     * Lấy customerId thực tế (Customer.id) từ JWT.
     * JWT strategy set (req as any).user = { userId: payload.sub } (payload.sub = User.id).
     * Cart.customerId / Order.customerId là FK tới Customer.id, không phải User.id,
     * nên phải resolve qua bảng Customer (userId -> id).
     */
    private async getCustomerId(req: Request): Promise<string | undefined> {
        const userId = (req as any).user?.userId;
        if (!userId) return undefined;
        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });
        return customer?.id;
    }
}
