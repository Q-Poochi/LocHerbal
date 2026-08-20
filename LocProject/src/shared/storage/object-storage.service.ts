import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

/**
 * Lưu file vào Object Storage theo chuẩn S3 API.
 * - Local/dev: MinIO (docker-compose) — forcePathStyle=true.
 * - Production: MinIO trên Railway (hoặc Cloudflare R2 / Backblaze B2) — chỉ khác env,
 *   không đổi code.
 * - URL công khai: nếu set S3_PUBLIC_URL thì dùng đúng giá trị đó + key;
 *   ngược lại tự suy ra `${S3_ENDPOINT}/${S3_BUCKET}` (phù hợp MinIO path-style).
 */
@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'ecommerce-uploads';
    const endpoint = (process.env.S3_ENDPOINT || '').trim();

    if (!endpoint) {
      this.client = null;
      this.publicBaseUrl = '';
      this.logger.warn('S3_ENDPOINT chưa cấu hình — tính năng upload ảnh sẽ lỗi khi gọi.');
      return;
    }

    this.client = new S3Client({
      endpoint,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      // Bắt buộc cho MinIO (path-style), R2/B2 cũng chấp nhận.
      forcePathStyle: true,
    });

    this.publicBaseUrl = (process.env.S3_PUBLIC_URL || `${endpoint}/${this.bucket}`).replace(/\/+$/, '');
  }

  async onModuleInit(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`S3 bucket "${this.bucket}" đã tồn tại`);
    } catch {
      // Bucket chưa tồn tại → tạo mới (best-effort; nếu thiếu quyền chỉ log cảnh báo).
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Đã tạo S3 bucket "${this.bucket}"`);
      } catch (err) {
        this.logger.warn(`Không tự tạo được bucket "${this.bucket}": ${(err as Error).message}`);
      }
      await this.tryMakePublic();
    }
  }

  /**
   * Upload file và trả về URL công khai.
   * @param key  đường dẫn trong bucket, vd: products/<uuid>.webp
   */
  async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!this.client) {
      throw new Error('Object storage chưa được cấu hình (thiếu S3_ENDPOINT)');
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return `${this.publicBaseUrl}/${key}`;
  }

  /** Đặt policy public-read để trình duyệt load ảnh trực tiếp (MinIO; R2 dùng r2.dev/custom domain). */
  private async tryMakePublic(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicRead',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/*`],
              },
            ],
          }),
        }),
      );
      this.logger.log(`Bucket "${this.bucket}" đã đặt public-read`);
    } catch (err) {
      this.logger.warn(`Không đặt public-read được (có thể cần cấu hình thủ công): ${(err as Error).message}`);
    }
  }
}