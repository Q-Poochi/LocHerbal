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