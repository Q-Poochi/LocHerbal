import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CouponService } from '../services/coupon.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from '../dto/coupon.dto';

@Controller('marketing/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CouponController {
    constructor(private readonly couponService: CouponService) { }

    @Get()
    @Roles('admin', 'staff')
    findAll() {
        return this.couponService.findAll();
    }

    @Get(':id')
    @Roles('admin', 'staff')
    findOne(@Param('id') id: string) {
        return this.couponService.findById(id);
    }

    @Post()
    @Roles('admin')
    create(@Body() createCouponDto: CreateCouponDto) {
        return this.couponService.create(createCouponDto);
    }

    @Patch(':id')
    @Roles('admin')
    update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
        return this.couponService.update(id, updateCouponDto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.couponService.remove(id);
    }

    @Post('validate')
    @Roles('admin', 'staff')
    validate(@Body() validateCouponDto: ValidateCouponDto) {
        return this.couponService.validateCode(validateCouponDto.code, validateCouponDto.orderValue);
    }
}