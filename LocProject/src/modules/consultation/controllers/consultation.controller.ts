import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { User } from '../../core/decorators/user.decorator';
import { ConsultationService } from '../services/consultation.service';
import { AssignLeadDto, CreateConsultationLeadDto, UpdateLeadStatusDto } from '../dto/consultation.dto';

@ApiTags('Consultation')
@Controller('consultations')
export class ConsultationController {
    constructor(private readonly consultationService: ConsultationService) { }

    @Public()
    @Get('slots')
    @ApiOperation({ summary: 'Khung giờ tư vấn khả dụng theo ngày (public)' })
    async slots(@Query('date') date?: string) {
        return this.consultationService.getSlots(date);
    }

    @Public()
    @Post()
    @ApiOperation({ summary: 'Gửi yêu cầu tư vấn / đặt lịch (public)' })
    async create(@Body() dto: CreateConsultationLeadDto, @User('userId') userId?: string) {
        void userId;
        return this.consultationService.create(dto);
    }

    @Roles('admin', 'staff')
    @Get()
    @ApiOperation({ summary: 'Danh sách yêu cầu tư vấn (admin)' })
    async findAll(
        @Query('status') status?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    ) {
        return this.consultationService.findAll({ status, page, limit });
    }

    @Roles('admin', 'staff')
    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết yêu cầu tư vấn (admin)' })
    async findById(@Param('id') id: string) {
        return this.consultationService.findById(id);
    }

    @Roles('admin', 'staff')
    @Patch(':id/status')
    @ApiOperation({ summary: 'Cập nhật trạng thái yêu cầu (admin)' })
    async updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
        return this.consultationService.updateStatus(id, dto.status);
    }

    @Roles('admin')
    @Patch(':id/assign')
    @ApiOperation({ summary: 'Gán phụ trách xử lý (admin)' })
    async assign(@Param('id') id: string, @Body() dto: AssignLeadDto) {
        return this.consultationService.assign(id, dto.assigneeId);
    }
}