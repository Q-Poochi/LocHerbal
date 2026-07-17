import { IsOptional, IsString, IsArray, IsNumber, IsDateString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderItemDto } from './create-purchase-order.dto';

export class UpdatePurchaseOrderDto {
    @IsOptional()
    @IsDateString()
    expectedDate?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PurchaseOrderItemDto)
    items?: PurchaseOrderItemDto[];
}