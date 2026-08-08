import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsOptional, IsString, validateSync } from 'class-validator';

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
}

/**
 * Fail-fast khi boot: app KHÔNG khởi động nếu thiếu biến môi trường bắt buộc.
 * Dùng cho ConfigModule.forRoot({ validate }). Các biến còn lại vẫn đọc qua
 * process.env như trước (chỉ kiểm tra cốt lõi ở đây theo Đợt 2 BƯỚC 6).
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

  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
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