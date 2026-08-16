import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';/**
 * Request logging middleware — ghi log JSON 1 dòng cho mỗi request:
 * method, path, status, duration, requestId, ip.
 *
 * Đồng thời gắn `requestId` vào response header `X-Request-Id` để truy vết
 * request qua log (tìm theo requestId khi debug lỗi production).
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = randomUUID();
    const start = Date.now();
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '-';

    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      this.logger.log({
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs,
        ip,
      });
    });

    next();
  }
}
