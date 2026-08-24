import { Controller, Post, Body, UseGuards, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../../modules/core/decorators/public.decorator';
import { Roles } from '../../../modules/core/decorators/roles.decorator';
import { RolesGuard } from '../../../modules/core/guards/roles.guard';
import { JwtAuthGuard } from '../../../modules/core/guards/jwt-auth.guard';
import { User } from '../../../modules/core/decorators/user.decorator';
import { SupportService } from '../services/support.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketQueryDto } from '../dto/ticket-query.dto';
import { TicketResponseDto, TicketListResponseDto } from '../dto/ticket-response.dto';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Khách gửi yêu cầu hỗ trợ (public, không cần đăng nhập)' })
  @ApiResponse({ status: 201, description: 'Ticket đã được tạo', type: 'object' })
  @ApiResponse({ status: 429, description: 'Quá nhiều yêu cầu, vui lòng thử lại sau' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 requests per 10 minutes
  async createTicket(
    @Body() dto: CreateTicketDto,
    @User('customerId') customerId: string | undefined,
  ) {
    return this.supportService.createTicket(dto, customerId);
  }

  @Get('admin/tickets')
  @ApiOperation({ summary: 'Admin: Lấy danh sách ticket (có filter, phân trang)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async getTickets(@Query() query: TicketQueryDto) {
    return this.supportService.getTickets(query);
  }

  @Get('admin/tickets/:id')
  @ApiOperation({ summary: 'Admin: Xem chi tiết ticket' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async getTicketById(@Param('id') id: string) {
    return this.supportService.getTicketById(id);
  }

  @Patch('admin/tickets/:id')
  @ApiOperation({ summary: 'Admin: Cập nhật ticket (status, assignedTo)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.supportService.updateTicket(id, dto);
  }
}