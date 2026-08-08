import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponService } from '../services/coupon.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from '../dto/coupon.dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CouponController {
    constructor(private readonly couponService: CouponService) { }

    @Get()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Danh sách mã giảm giá' })
    findAll() {
        return this.couponService.findAll();
    }

    @Get(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Chi tiết mã giảm giá' })
    findOne(@Param('id') id: string) {
        return this.couponService.findById(id);
    }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Tạo mã giảm giá mới' })
    create(@Body() createCouponDto: CreateCouponDto) {
        return this.couponService.create(createCouponDto);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Cập nhật mã giảm giá' })
    update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
        return this.couponService.update(id, updateCouponDto);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Xoá mã giảm giá' })
    remove(@Param('id') id: string) {
        return this.couponService.remove(id);
    }

    @Post('validate')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Kiểm tra mã giảm giá' })
    validate(@Body() validateCouponDto: ValidateCouponDto) {
        return this.couponService.validateCode(validateCouponDto.code, validateCouponDto.orderValue);
    }
}