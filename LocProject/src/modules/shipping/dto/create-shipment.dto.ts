import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateShipmentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsString()
    @IsNotEmpty()
    carrierId: string;

    @IsNumber()
    @IsNotEmpty()
    shippingFee: number;

    @IsOptional()
    estimatedDelivery?: string;
}