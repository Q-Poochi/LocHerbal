import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CompanySettingsService } from '../services/company-settings.service';
import { UpdateCompanySettingsDto } from '../dto/update-company-settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class CompanySettingsController {
    constructor(private readonly settingsService: CompanySettingsService) { }

    @Public()
    @Get('company')
    @ApiOperation({ summary: 'Thông tin công ty (public — Footer, Về chúng tôi, Liên hệ)' })
    getCompany() {
        return this.settingsService.get();
    }

    @Get('company/admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thông tin công ty (admin)' })
    getCompanyAdmin() {
        return this.settingsService.get();
    }

    @Patch('company')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật thông tin công ty (admin)' })
    updateCompany(@Body() dto: UpdateCompanySettingsDto) {
        return this.settingsService.update(dto as Record<string, unknown>);
    }
}