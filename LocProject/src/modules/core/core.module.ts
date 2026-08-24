import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { HealthService } from './services/health.service';
import { AuthController } from './controllers/auth.controller';
import { HealthController } from './controllers/health.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PrismaModule } from '../../shared/prisma/prisma.module';

import { OtpService } from './services/otp.service';
import { EmailService } from './services/email.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      // Fail-fast: không fallback hardcode — nếu thiếu env thì app crash ngay khi khởi tạo module
      secret: (() => {
        const s = process.env.JWT_ACCESS_SECRET;
        if (!s) throw new Error('[FATAL] Thiếu biến môi trường: JWT_ACCESS_SECRET');
        return s;
      })(),
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
  ],
  providers: [
    AuthService,
    OtpService,
    EmailService,
    HealthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AuthController, HealthController],
  exports: [AuthService],
})
export class CoreModule {}
