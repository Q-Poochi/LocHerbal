import { Controller, Post, Body, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CarrierWebhookService } from '../services/carrier-webhook.service';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Shipping')
@Controller('api/v1/shipping/webhooks')
export class CarrierWebhookController {
    constructor(private readonly webhookService: CarrierWebhookService) { }

    @Public()
    @Post('ghn')
    @HttpCode(200)
    @ApiOperation({ summary: 'Webhook GHN — callback trạng thái vận đơn (không cần auth)' })
    handleGhn(@Body() body: any, @Query('token') token?: string) {
        return this.webhookService.handleGhn(body, token);
    }

    @Public()
    @Post('ghtk')
    @HttpCode(200)
    @ApiOperation({ summary: 'Webhook GHTK — callback trạng thái vận đơn (không cần auth)' })
    handleGhtk(@Body() body: any, @Query('hash') hash?: string) {
        return this.webhookService.handleGhtk(body, hash);
    }
}
