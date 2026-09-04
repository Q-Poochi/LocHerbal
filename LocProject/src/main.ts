import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { setCsrfCookie, csrfGuard } from './shared/middleware/csrf.middleware';
import { RequestLoggerMiddleware } from './shared/middleware/request-logger.middleware';
import { JsonLogger } from './shared/services/json-logger.service';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { parseCorsOrigins } from './shared/config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // JSON structured logging — mỗi log là 1 dòng JSON (parse được bởi log aggregator)
  app.useLogger(new JsonLogger());

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      strictTransportSecurity: {
        maxAge: 31536000, // 1 năm — đủ điều kiện HSTS preload
        includeSubDomains: true,
        preload: true,
      },
    }),
  );
  app.use(cookieParser());
  // Webhook GHN/GHTK có thể gửi form-urlencoded (GHTK dùng application/x-www-form-urlencoded)
  app.use(express.urlencoded({ extended: true }));

  // Request logging + requestId (X-Request-Id) — đặt ĐẦU TIÊN để đo toàn bộ thời gian request
  const requestLogger = new RequestLoggerMiddleware();
  app.use(requestLogger.use.bind(requestLogger));

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
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    // Browser cache ảnh sản phẩm 7 ngày — ảnh mới luôn có tên file mới
    // nên không lo stale; đổi tên là cách bust cache khi thay ảnh.
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
