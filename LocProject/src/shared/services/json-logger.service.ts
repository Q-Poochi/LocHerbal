import { LoggerService, Injectable } from '@nestjs/common';

/**
 * JSON structured logger — mỗi log là 1 dòng JSON (NDJSON/JSONL).
 *
 * Dùng thay Logger mặc định của NestJS để Railway / hệ thống log aggregation
 * parse được theo key (level, message, context, requestId...), lọc theo level,
 * tìm theo requestId khi debug.
 */
@Injectable()
export class JsonLogger implements LoggerService {
  private write(level: string, message: unknown, ...optionalParams: unknown[]) {
    let context: string | undefined;

    if (optionalParams.length > 0 && typeof optionalParams[optionalParams.length - 1] === 'string') {
      context = optionalParams[optionalParams.length - 1] as string;
    }

    const entry: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
    };

    // Object log (vd: request logger) → merge trực tiếp vào entry để log cấu trúc sạch,
    // không bị lồng JSON string. Chỉ merge object thuần (không phải Error/Date...).
    if (message && typeof message === 'object' && !(message instanceof Error)) {
      Object.assign(entry, message as Record<string, unknown>);
    } else {
      entry.message = typeof message === 'string' ? message : JSON.stringify(message);
    }

    if (context) entry.context = context;

    // Error object truyền trực tiếp → đưa stack vào field riêng, không mất thông tin.
    if (message instanceof Error) {
      entry.message = message.message;
      if (message.stack) entry.stack = message.stack;
    }

    const line = JSON.stringify(entry);
    if (level === 'error' || level === 'fatal') {
      // eslint-disable-next-line no-console
      console.error(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  }

  log(message: any, ...optionalParams: any[]) {
    this.write('log', message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.write('error', message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.write('warn', message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.write('debug', message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.write('verbose', message, ...optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]) {
    this.write('fatal', message, ...optionalParams);
  }
}
