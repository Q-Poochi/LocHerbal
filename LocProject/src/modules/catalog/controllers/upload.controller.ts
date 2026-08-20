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
import sharp from 'sharp';
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
  ) {}

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
      let meta: sharp.OutputInfo;
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
      try {
        url = await this.storage.putObject(key, optimized, 'image/webp');
      } catch (err) {
        throw new BadRequestException(
          'Không thể lưu ảnh vào Object Storage (chưa cấu hình S3_ENDPOINT hoặc lỗi kết nối). ' +
            `Chi tiết: ${(err as Error).message}`,
        );
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