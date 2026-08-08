import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

  // CORS phải đặt TRƯỚC các middleware khác để mọi response (kể cả lỗi) đều có CORS headers
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    credentials: true,
  });

  // Middleware tạo CSRF token cookie nếu chưa có — chạy TRƯỚC CSRF check
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies?.['csrf_token']) {
      const token = require('crypto').randomBytes(32).toString('hex');
      res.cookie('csrf_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    }
    next();
  });

  // CSRF: double-submit cookie pattern (fail-closed cho browser, thân thiện cho API client)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) return next();

    // Bỏ qua CSRF cho request same-origin (browser gửi Sec-Fetch-Site: same-origin/none).
    // Same-origin request không phải vector CSRF → cho phép Swagger UI (/api/docs) dùng được.
    const secFetchSite = req.headers['sec-fetch-site'] as string | undefined;
    if (secFetchSite === 'same-origin' || secFetchSite === 'none') return next();

    const csrfCookie = req.cookies?.['csrf_token'];
    const csrfHeader = req.headers?.['x-csrf-token'] as string;
    const match = csrfCookie && csrfHeader && csrfCookie === csrfHeader;
    if (match) return next();

    // Request có "dấu hiệu trình duyệt" (Sec-Fetch-Site / Origin) HOẶC có sẵn CSRF cookie
    // → phải khớp double-submit, nếu không thì TỪ CHỐI (fail-closed).
    // Che được cả vector: browser cross-site (form/JS của trang khác) sẽ gửi
    // Sec-Fetch-Site: cross-site nhưng KHÔNG kèm cookie (SameSite=Strict) → chặn.
    const browserLike = !!secFetchSite || !!req.headers['origin'];
    if (browserLike || csrfCookie) {
      res.status(403).json({ statusCode: 403, message: 'CSRF token không hợp lệ', error: 'Forbidden' });
      return;
    }

    // Client không cookie, không dấu browser (curl, k6, server-to-server, mobile app)
    // → không có ambient session để bị CSRF, cho qua.
    next();
  });

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
