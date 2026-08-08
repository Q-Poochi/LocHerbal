import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { HealthService } from '../services/health.service';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Kiểm tra trạng thái hoạt động' })
    async check() {
        return this.healthService.check();
    }

    @Public()
    @Get('readiness')
    @ApiOperation({ summary: 'Sẵn sàng phục vụ (readiness)' })
    async readiness() {
        return this.healthService.readiness();
    }
}
