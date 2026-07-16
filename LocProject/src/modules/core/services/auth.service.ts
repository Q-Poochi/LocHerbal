import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

/**
 * Helper: lấy biến môi trường bắt buộc, throw ngay nếu thiếu.
 * Không bao giờ fallback sang chuỗi hardcode — tránh lỗ hổng auth.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[FATAL] Thiếu biến môi trường bắt buộc: ${name}. App không thể khởi động an toàn.`);
  }
  return value;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
      },
    });

    return { id: user.id, email: user.email, fullName: user.fullName };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id);

    return {
      accessToken,
      refreshToken,
      user: this.toUserDto(user),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    return this.toUserDto(user);
  }

  private toUserDto(user: {
    id: string;
    email: string;
    fullName: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    };
  }

  async rotateTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: requireEnv('JWT_REFRESH_SECRET'),
      });

      const session = await this.prisma.userSession.findUnique({
        where: { jti: payload.jti },
      });

      if (!session) {
        throw new UnauthorizedException('Session không tồn tại');
      }

      // Kiểm tra bcrypt hash của refreshToken
      const isValid = await bcrypt.compare(refreshToken, session.hashedToken);
      if (!isValid) {
        throw new UnauthorizedException('Token không khớp');
      }

      // Phát hiện Replay Attack (token đã bị revoke nhưng vẫn cố sử dụng)
      if (session.isRevoked) {
        // Thu hồi toàn bộ token của user này
        await this.prisma.userSession.updateMany({
          where: { userId: payload.sub },
          data: { isRevoked: true },
        });
        throw new UnauthorizedException('Cảnh báo bảo mật: Token đã được sử dụng!');
      }

      // Xóa/Thu hồi phiên cũ
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });

      return this.generateTokens(payload.sub);
    } catch (e) {
      throw new UnauthorizedException((e as Error).message || 'Token không hợp lệ hoặc đã hết hạn');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: requireEnv('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
      });

      const session = await this.prisma.userSession.findUnique({
        where: { jti: payload.jti },
      });

      if (session) {
        await this.prisma.userSession.update({
          where: { id: session.id },
          data: { isRevoked: true },
        });
      }
    } catch (e) {
      // Bỏ qua lỗi verify nếu token đã hết hạn khi logout
    }
  }

  private async generateTokens(userId: string) {
    const jti = crypto.randomUUID(); // Dùng built-in crypto để tạo jti an toàn
    const payload = { sub: userId, jti };

    const accessToken = this.jwtService.sign(payload, {
      secret: requireEnv('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: requireEnv('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // Hash refreshToken trước khi lưu (yêu cầu bắt buộc)
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.userSession.create({
      data: {
        userId,
        jti,
        hashedToken,
        isRevoked: false,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
