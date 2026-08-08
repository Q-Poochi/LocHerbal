import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ShipmentStatus } from '@prisma/client';

export class UpdateShipmentStatusDto {
    @IsString()
    @IsNotEmpty()
    status: ShipmentStatus;

    @IsOptional()
    note?: string;
}