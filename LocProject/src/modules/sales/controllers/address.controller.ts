import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { User } from '../../core/decorators/user.decorator';
import { AddressService } from '../services/address.service';
import { CreateAddressDto } from '../dto/create-address.dto';

@Controller('customers/addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    @Get()
    async findAll(@User('userId') userId: string) {
        return this.addressService.findAll(userId);
    }

    @Post()
    async create(@User('userId') userId: string, @Body() dto: CreateAddressDto) {
        return this.addressService.create(userId, dto);
    }

    @Patch(':id/default')
    async setDefault(@User('userId') userId: string, @Param('id') id: string) {
        return this.addressService.setDefault(id, userId);
    }

    @Delete(':id')
    async delete(@User('userId') userId: string, @Param('id') id: string) {
        return this.addressService.delete(id, userId);
    }
}