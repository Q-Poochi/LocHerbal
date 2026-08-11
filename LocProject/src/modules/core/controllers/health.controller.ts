import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Health check cho nền tảng deploy (Railway) — ping DB để xác nhận service sống.
   * Không yêu cầu auth, không CSRF (GET, không thay đổi state).
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check (không auth)' })
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
