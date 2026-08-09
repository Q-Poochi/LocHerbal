import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CompanySettingsService } from './services/company-settings.service';
import { CompanySettingsController } from './controllers/settings.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService],
  exports: [CompanySettingsService],
})
export class SettingsModule { }