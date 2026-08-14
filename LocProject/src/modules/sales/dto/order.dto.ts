import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class CancelOrderDto {
    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsOptional()
    @IsString()
    note?: string;
}

export class AdminOrderQueryDto extends PaginationDto {
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}

/**
 * Dữ liệu checkout từ form: địa chỉ giao hàng, ghi chú, phương thức thanh toán.
 * `addressId` nếu khách chọn địa chỉ đã lưu; ngược lại backend tự tạo CustomerAddress
 * từ các field form (fullName/phone/province/district/ward/address).
 */
export class CheckoutDto {
    @IsOptional()
    @IsString()
    addressId?: string;

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    province?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    ward?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    paymentMethod?: string;
}