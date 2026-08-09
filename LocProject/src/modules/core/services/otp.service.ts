import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface OtpProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

export class MockOtpProvider implements OtpProvider {
  private readonly logger = new Logger(MockOtpProvider.name);
  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`[MOCK OTP] Gửi OTP tới SĐT: ${phone} - Mã OTP: ${code}`);
  }
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly provider: OtpProvider;

  constructor(private readonly prisma: PrismaService) {
    const isProduction = process.env.NODE_ENV === 'production';
    const smsApiKey = process.env.SMS_PROVIDER_API_KEY;

    if (isProduction && !smsApiKey) {
      throw new Error('FATAL: Chưa cấu hình SMS provider thật cho production. Không được dùng mock OTP.');
    }

    this.provider = new MockOtpProvider();
  }

  async generateAndSendOtp(phone: string, purpose: 'login' | 'register'): Promise<string | null> {
    const phoneRegex = /^0[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu từ 03-09)');
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        purpose,
        expiresAt,
      },
    });

    await this.provider.sendOtp(phone, code);

    if (process.env.NODE_ENV !== 'production') {
      return code;
    }
    return null;
  }

  async verifyOtp(phone: string, code: string, purpose: 'login' | 'register'): Promise<boolean> {
    const now = new Date();

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose,
        consumedAt: null,
        expiresAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const isMatch = await bcrypt.compare(code, otp.codeHash);
    if (!isMatch) {
      const newAttempts = otp.attempts + 1;
      
      if (newAttempts >= otp.maxAttempts) {
        await this.prisma.otpCode.update({
          where: { id: otp.id },
          data: {
            attempts: newAttempts,
            consumedAt: now,
          },
        });
        throw new BadRequestException('Mã OTP đã thử sai quá số lần tối đa và bị khóa. Vui lòng yêu cầu mã mới.');
      }

      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: newAttempts },
      });

      const remaining = otp.maxAttempts - newAttempts;
      throw new BadRequestException(`Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`);
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: now },
    });

    return true;
  }
}
