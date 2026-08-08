import { Controller, Post, UseInterceptors, UploadedFiles, BadRequestException, UseGuards } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { open, rename, unlink } from 'fs/promises';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';

// Chỉ chấp nhận file ảnh raster thật theo NỘI DUNG (magic bytes), không tin mimetype/đuôi client khai báo.
// Loại trừ tuyệt đối: .svg (vector có thể nhúng script), .html và mọi đuôi khác ngoài whitelist.
const ALLOWED_IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAGIC_READ_LIMIT = 64 * 1024; // đủ để nhận diện chữ ký PNG/JPEG/WEBP
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'products');

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
  @Post()
  @ApiOperation({ summary: 'Upload ảnh sản phẩm (admin/staff, multipart)' })
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
      storage: diskStorage({
        destination: UPLOAD_DIR,
        // Lưu tạm KHÔNG có đuôi; đuôi chỉ được gán SAU khi xác minh nội dung thật.
        filename: (_req, _file, cb) => cb(null, randomUUID()),
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được tải lên');
    }

    const verified: Array<Express.Multer.File> = [];
    const movedPaths: string[] = [];

    try {
      for (const f of files) {
        const buf = Buffer.alloc(Math.min(f.size, MAGIC_READ_LIMIT));
        const handle = await open(f.path, 'r');
        try {
          await handle.read(buf, 0, buf.length, 0);
        } finally {
          await handle.close();
        }

        // Định danh từ nội dung thật — mimetype client claim hoàn toàn bị bỏ qua.
        const ext = detectImage(buf);
        if (!ext || !ALLOWED_IMAGE_EXTS.has(ext)) {
          throw new BadRequestException(
            `File "${f.originalname}" bị từ chối: không phải ảnh hợp lệ (chỉ chấp nhận PNG, JPEG, WEBP theo nội dung thật)`,
          );
        }

        const safeName = `${f.filename}.${ext}`;
        const target = join(UPLOAD_DIR, safeName);
        await rename(f.path, target);
        movedPaths.push(target);
        f.filename = safeName;
        verified.push(f);
      }
    } catch (err) {
      // Dọn toàn bộ file đã ghi ra đĩa (kể cả đã rename) — chặn mọi file không hợp lệ lưu lại.
      const orphans = [...files.map((x) => x.path), ...movedPaths];
      await Promise.all(orphans.map((p) => unlink(p).catch(() => { /* đã xóa */ })));
      throw err instanceof BadRequestException
        ? err
        : new BadRequestException('Không thể xác minh nội dung file ảnh');
    }

    const baseUrl = process.env.API_URL || 'http://localhost:4000';
    return verified.map((f) => ({
      url: `${baseUrl}/uploads/products/${f.filename}`,
      filename: f.filename,
      size: f.size,
    }));
  }
}