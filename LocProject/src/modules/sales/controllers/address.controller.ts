import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { User } from '../../core/decorators/user.decorator';
import { AddressService } from '../services/address.service';
import { CreateAddressDto } from '../dto/create-address.dto';

@ApiTags('Customer Addresses')
@ApiBearerAuth()
@Controller('customers/addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách địa chỉ của khách hàng hiện tại' })
    async findAll(@User('userId') userId: string) {
        return this.addressService.findAll(userId);
    }

    @Post()
    @ApiOperation({ summary: 'Tạo địa chỉ mới' })
    async create(@User('userId') userId: string, @Body() dto: CreateAddressDto) {
        return this.addressService.create(userId, dto);
    }

    @Patch(':id/default')
    @ApiOperation({ summary: 'Đặt địa chỉ làm mặc định' })
    async setDefault(@User('userId') userId: string, @Param('id') id: string) {
        return this.addressService.setDefault(id, userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xoá địa chỉ' })
    async delete(@User('userId') userId: string, @Param('id') id: string) {
        return this.addressService.delete(id, userId);
    }
}