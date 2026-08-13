import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';

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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      // Không lộ email đã đăng ký — trả message trung lập (pattern forgot-password)
      return { message: 'Nếu email hợp lệ, hướng dẫn xác thực đã được gửi' };
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          emailVerified: false,
          emailVerificationToken,
          emailVerificationExpiry,
        },
      });

      await tx.customer.create({
        data: {
          userId: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
        },
      });

      return newUser;
    });

    // Gửi email xác thực. Nếu gửi thất bại (Resend lỗi tạm thời) vẫn giữ tài khoản
    // đã tạo — user có thể bấm "gửi lại" sau. Không chặn đăng ký.
    try {
      await this.emailService.sendVerificationEmail(dto.email, dto.fullName, emailVerificationToken);
    } catch (e) {
      this.logger.error(`Không gửi được email xác thực tới ${dto.email}: ${(e as Error).message}`);
    }

    return { id: user.id, email: user.email, fullName: user.fullName };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Link xác thực không hợp lệ');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email đã được xác thực trước đó');
    }

    if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException('Link xác thực đã hết hạn. Vui lòng yêu cầu gửi lại.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return { message: 'Xác thực email thành công' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Không lộ thông tin email đã tồn tại hay chưa
      return { message: 'Nếu email tồn tại, link xác thực đã được gửi lại' };
    }

    if (user.emailVerified) {
      // Không lộ trạng thái đã xác thực — message trung lập giống case email không tồn tại
      return { message: 'Nếu email tồn tại, link xác thực đã được gửi lại' };
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken, emailVerificationExpiry },
    });

    await this.emailService.sendVerificationEmail(email, user.fullName, emailVerificationToken);

    return { message: 'Link xác thực đã được gửi lại' };
  }

  async requestOtp(phone: string, purpose: 'login' | 'register') {
    const phoneRegex = /^0[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('Số điện thoại không đúng định dạng Việt Nam');
    }

    // Không phân biệt SĐT đã/chưa đăng ký để tránh enumeration — luôn gửi OTP.
    return this.otpService.generateAndSendOtp(phone, purpose);
  }

  async verifyOtp(phone: string, code: string, purpose: 'login' | 'register') {
    await this.otpService.verifyOtp(phone, code, purpose);

    let user = await this.prisma.user.findFirst({
      where: { phone },
    });

    if (purpose === 'login') {
      if (!user) {
        throw new BadRequestException('Mã OTP hoặc số điện thoại không hợp lệ');
      }
    } else {
      if (!user) {
        const dummyEmail = `${phone}@locherbal.local`;
        
        const emailCheck = await this.prisma.user.findUnique({ where: { email: dummyEmail } });
        if (emailCheck) {
          throw new BadRequestException('Email đăng ký tự động đã tồn tại, vui lòng liên hệ admin');
        }

        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: dummyEmail,
              passwordHash,
              fullName: `SĐT ${phone}`,
              phone,
            },
          });

          await tx.customer.create({
            data: {
              userId: newUser.id,
              fullName: newUser.fullName,
              email: newUser.email,
              phone: newUser.phone,
            },
          });

          return newUser;
        });
      }
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id);

    return {
      accessToken,
      refreshToken,
      user: this.toUserDto(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { role: true } } },
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

  async updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      include: { roles: { include: { role: true } } },
    });

    // Cập nhật Customer tương ứng
    await this.prisma.customer.updateMany({
      where: { userId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    return this.toUserDto(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto, currentJti?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      // Thu hồi toàn bộ phiên khác (trừ phiên đang thực hiện đổi mật khẩu)
      await tx.userSession.updateMany({
        where: {
          userId,
          ...(currentJti ? { jti: { not: currentJti } } : {}),
          isRevoked: false,
        },
        data: { isRevoked: true },
      });
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
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
    phone?: string | null;
    roles?: { role: { name: string } }[];
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      ...(user.phone ? { phone: user.phone } : {}),
      roles: (user.roles ?? []).map(ur => ur.role.name),
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

  async forgotPassword(email: string) {
    // Message trung lập — KHÔNG lộ email có tồn tại hay không (chống enumeration).
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'Nếu email tồn tại, hướng dẫn đã được gửi' };
    }

    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    // 15 phút — ngắn hơn email verify (24h) vì đặt lại mật khẩu nhạy cảm hơn.
    const passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken, passwordResetExpiry },
    });

    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.fullName, passwordResetToken);
    } catch (e) {
      this.logger.error(`Không gửi được email đặt lại mật khẩu tới ${user.email}: ${(e as Error).message}`);
    }

    return { message: 'Nếu email tồn tại, hướng dẫn đã được gửi' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Xóa token + expiry NGAY khi dùng → cùng token không reset được 2 lần.
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    // Vô hiệu hóa mọi session đang hoạt động của user (mật khẩu đổi → token cũ vô hiệu).
    await this.prisma.userSession.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    return { message: 'Mật khẩu đã được đặt lại thành công' };
  }

  private async generateTokens(userId: string) {
    const jti = crypto.randomUUID();

    // Query user kèm roles để đưa vào JWT payload
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    const roleNames = user?.roles.map(ur => ur.role.name) ?? [];

    const payload = { sub: userId, jti, roles: roleNames };

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