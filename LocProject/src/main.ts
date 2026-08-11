import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { setCsrfCookie, csrfGuard } from './shared/middleware/csrf.middleware';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { parseCorsOrigins } from './shared/config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  // Webhook GHN/GHTK có thể gửi form-urlencoded (GHTK dùng application/x-www-form-urlencoded)
  app.use(express.urlencoded({ extended: true }));

  // CORS phải đặt TRƯỚC các middleware khác để mọi response (kể cả lỗi) đều có CORS headers
  // Origins lấy từ env CORS_ORIGINS (CSV) — không hardcode localhost ở production.
  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGINS),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    credentials: true,
  });

  // Middleware tạo CSRF token cookie nếu chưa có — chạy TRƯỚC CSRF check
  app.use(setCsrfCookie);

  // CSRF: double-submit cookie pattern (fail-closed cho browser, thân thiện cho API client)
  app.use(csrfGuard);

  const uploadsDir = join(process.cwd(), 'uploads', 'products');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LocHerbal API')
    .setDescription('API cho hệ thống thương mại điện tử thảo dược LocHerbal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  // Chỉ bật Swagger UI/docs khi KHÔNG chạy production — không lộ schema/struct hệ thống ra ngoài.
  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Global exception filter — handles Prisma errors, unified response format
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe — whitelist, forbid non-whitelisted, auto-transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
