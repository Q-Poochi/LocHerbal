import { IsString, IsNumber, IsBoolean, IsOptional, IsDate, IsEnum } from 'class-validator';
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

    @IsDate()
    startDate: Date;

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

    @IsDate()
    @IsOptional()
    startDate?: Date;

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