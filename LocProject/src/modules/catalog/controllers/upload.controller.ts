import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import sharp from 'sharp';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';
import { ObjectStorageService } from '../../../shared/storage/object-storage.service';

// Chỉ chấp nhận file ảnh raster thật theo NỘI DUNG (magic bytes), không tin mimetype/đuôi client khai báo.
// Loại trừ tuyệt đối: .svg (vector có thể nhúng script), .html và mọi đuôi khác ngoài whitelist.
const ALLOWED_IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_WIDTH = 800; // resize chiều lớn nhất ~800px — đủ cho web, giảm tải bandwidth
const WEBP_QUALITY = 80;

// Nhận diện định dạng ảnh raster bằng MAGIC BYTES (không tin mimetype/đuôi từ client).
// Trả về đuôi chuẩn hoá, hoặc null nếu không phải PNG/JPEG/WEBP.
function detectImage(buf: Buffer): string | null {
  if (!buf || buf.length < 12) {
    return null;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e &&
    buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a &&
    buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpg';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
}

@ApiTags('File Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(
    @Inject(ObjectStorageService)
    private readonly storage: ObjectStorageService,
    private readonly config: ConfigService,
  ) {}

  private readonly localUploadDir = join(process.cwd(), 'uploads');
  private readonly localPublicPrefix = '/uploads';

  private async saveLocal(key: string, buffer: Buffer): Promise<string> {
    try {
      await mkdir(this.localUploadDir, { recursive: true });
      const filePath = join(this.localUploadDir, key);
      await writeFile(filePath, buffer);
      const baseUrl = this.config.get<string>('API_URL') || 'http://localhost:4000';
      console.log('[UPLOAD] API_URL:', baseUrl, '| saved:', filePath, '-> URL:', `${baseUrl}${this.localPublicPrefix}/${key}`);
      return `${baseUrl}${this.localPublicPrefix}/${key}`;
    } catch (e) {
      console.error('[UPLOAD] saveLocal ERROR:', e);
      throw e;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Upload ảnh sản phẩm (admin/staff, multipart) — xử lý Sharp + lưu Object Storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được tải lên');
    }

    const uploaded: Array<{ url: string; filename: string; size: number; width?: number; height?: number }> = [];

    for (const f of files) {
      // Định danh từ nội dung thật — mimetype client claim hoàn toàn bị bỏ qua.
      const ext = detectImage(f.buffer);
      if (!ext || !ALLOWED_IMAGE_EXTS.has(ext)) {
        throw new BadRequestException(
          `File "${f.originalname}" bị từ chối: không phải ảnh hợp lệ (chỉ chấp nhận PNG, JPEG, WEBP theo nội dung thật)`,
        );
      }

      // Tối ưu: resize ≤800px + nén WebP. Không phóng to ảnh nhỏ.
      let optimized: Buffer;
      let meta: import('sharp').OutputInfo;
      try {
        ({ data: optimized, info: meta } = await sharp(f.buffer, { failOn: 'error' })
          .resize(MAX_WIDTH, MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer({ resolveWithObject: true }));
      } catch {
        throw new BadRequestException(`File "${f.originalname}" không thể xử lý thành WebP`);
      }

      const key = `products/${randomUUID()}.webp`;
      let url: string;
      console.log('[UPLOAD] storage.client:', !!this.storage['client'], '| localUploadDir:', this.localUploadDir);
      if (this.storage['client']) {
        // Có S3 → upload lên Object Storage
        url = await this.storage.putObject(key, optimized, 'image/webp');
      } else {
        // Chưa có S3 → lưu vào volume local (/app/uploads/products)
        url = await this.saveLocal(key, optimized);
      }

      uploaded.push({
        url,
        filename: key.split('/').pop() as string,
        size: optimized.length,
        width: meta.width,
        height: meta.height,
      });
    }

    return uploaded;
  }
}