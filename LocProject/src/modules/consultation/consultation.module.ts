import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ConsultationService } from './services/consultation.service';
import { ConsultationController } from './controllers/consultation.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ConsultationController],
  providers: [ConsultationService],
  exports: [ConsultationService],
})
export class ConsultationModule { }