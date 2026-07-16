import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
    @IsOptional()
    @IsString()
    note?: string;
}