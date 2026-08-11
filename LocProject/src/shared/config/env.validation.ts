import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

const REQUIRED_KEYS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'VNP_TMN_CODE',
  'VNP_HASH_SECRET',
  'VNP_URL',
] as const;

// CORS origins cho phép — env lưu dạng CSV "https://a.com,https://b.com"
const DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'];

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  VNP_TMN_CODE: string;

  @IsString()
  VNP_HASH_SECRET: string;

  @IsString()
  VNP_URL: string;

  @IsOptional()
  @IsString()
  VNP_RETURN_URL?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  THROTTLE_LIMIT?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  AUTH_THROTTLE_LIMIT?: number;

  @IsOptional()
  @IsString()
  SMS_PROVIDER_API_KEY?: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT?: number;

  @IsOptional()
  @IsString()
  API_URL?: string;

  // Token xác thực webhook nhà vận chuyển (GHN/GHTK). GHN docs khuyến nghị đặt
  // token trong URL callback; GHTK dùng tham số ?hash=. Nếu chưa tích hợp real,
  // để trống — webhook sẽ trả 403 cho mọi request.
  @IsOptional()
  @IsString()
  GHN_WEBHOOK_TOKEN?: string;

  @IsOptional()
  @IsString()
  GHTK_WEBHOOK_TOKEN?: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  // CSV: "https://a.com,https://b.com" — mặc định danh sách localhost
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;
}

/**
 * Fail-fast khi boot: app KHÔNG khởi động nếu thiếu biến môi trường bắt buộc.
 * Dùng cho ConfigModule.forRoot({ validate }).
 */
export function validate(config: Record<string, unknown>) {
  const missing = REQUIRED_KEYS.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `[FATAL] Thiếu biến môi trường bắt buộc: ${missing.join(
        ', ',
      )}. App không thể khởi động an toàn.`,
    );
  }

  // Chuyển giá trị number dạng chuỗi từ env trước khi validate
  const coerced: Record<string, unknown> = {
    ...config,
    THROTTLE_LIMIT: config.THROTTLE_LIMIT !== undefined && config.THROTTLE_LIMIT !== ''
      ? Number(config.THROTTLE_LIMIT)
      : config.THROTTLE_LIMIT,
    AUTH_THROTTLE_LIMIT: config.AUTH_THROTTLE_LIMIT !== undefined && config.AUTH_THROTTLE_LIMIT !== ''
      ? Number(config.AUTH_THROTTLE_LIMIT)
      : config.AUTH_THROTTLE_LIMIT,
    REDIS_PORT: config.REDIS_PORT !== undefined && config.REDIS_PORT !== ''
      ? Number(config.REDIS_PORT)
      : config.REDIS_PORT,
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, coerced, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints || {}).join(', ')}`)
      .join('; ');
    throw new Error(`[FATAL] Cấu hình môi trường không hợp lệ: ${details}`);
  }

  return validatedConfig;
}

/** Parse CORS_ORIGINS (CSV) thành array; fallback localhost list khi chưa set. */
export function parseCorsOrigins(configValue?: string): string[] {
  if (!configValue || configValue.trim() === '') {
    return DEFAULT_CORS_ORIGINS;
  }
  return configValue
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}