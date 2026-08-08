import { IsString, IsNumber, IsBoolean, IsOptional, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '@prisma/client';

export class CreateCouponDto {
    @IsString()
    code: string;

    @IsEnum(DiscountType)
    discountType: DiscountType;

    @IsNumber()
    discountValue: number;

    @IsNumber()
    @IsOptional()
    minOrderValue?: number;

    @IsNumber()
    @IsOptional()
    usageLimit?: number;

    @Type(() => Date)
    @IsDate()
    startDate: Date;

    @Type(() => Date)
    @IsDate()
    endDate: Date;

    @IsString()
    @IsOptional()
    campaignId?: string;
}

export class UpdateCouponDto {
    @IsString()
    @IsOptional()
    code?: string;

    @IsEnum(DiscountType)
    @IsOptional()
    discountType?: DiscountType;

    @IsNumber()
    @IsOptional()
    discountValue?: number;

    @IsNumber()
    @IsOptional()
    minOrderValue?: number;

    @IsNumber()
    @IsOptional()
    usageLimit?: number;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    startDate?: Date;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    endDate?: Date;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class ValidateCouponDto {
    @IsString()
    code: string;

    @IsNumber()
    orderValue: number;
}