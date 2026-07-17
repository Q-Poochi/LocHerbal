import { IsString, IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceivedItemDto {
    @IsString()
    productVariantId: string;

    @IsString()
    warehouseId: string;

    @IsNumber()
    @Min(1)
    qty: number;

    @IsNumber()
    @Min(0)
    unitCost: number;
}

export class ReceiveItemsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReceivedItemDto)
    items: ReceivedItemDto[];
}