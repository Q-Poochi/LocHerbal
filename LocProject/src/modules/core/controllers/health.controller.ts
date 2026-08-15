import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness check cho nền tảng deploy (Railway) — ping DB để xác nhận service sống.
   * Không yêu cầu auth, không CSRF (GET, không thay đổi state).
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check (không auth)' })
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness check — xác nhận service sẵn sàng nhận traffic (DB reachable).
   * Trả 503 khi DB down để orchestrator (Railway/k8s) không route traffic vào.
   * Không yêu cầu auth, không CSRF (GET, không thay đổi state).
   */
  @Public()
  @Get('readiness')
  @ApiOperation({ summary: 'Readiness check — 503 khi DB không sẵn sàng (không auth)' })
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready', timestamp: new Date().toISOString() });
    }
  }
}
