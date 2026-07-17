import { IsString, IsOptional, IsArray, IsNumber, IsDateString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
    @IsString()
    productVariantId: string;

    @IsNumber()
    @Min(1)
    qty: number;

    @IsNumber()
    @Min(0)
    unitCost: number;
}

export class CreatePurchaseOrderDto {
    @IsString()
    supplierId: string;

    @IsOptional()
    @IsDateString()
    expectedDate?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PurchaseOrderItemDto)
    items: PurchaseOrderItemDto[];
}