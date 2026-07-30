import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { HealthService } from '../services/health.service';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Public()
    @Get()
    async check() {
        return this.healthService.check();
    }

    @Public()
    @Get('readiness')
    async readiness() {
        return this.healthService.readiness();
    }
}
