import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface OtpProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

/**
 * Provider SMS thật qua ESMS (https://esms.vn) — tin cố định giá rẻ (SmsType=8),
 * phù hợp gửi OTP cho SME. KHÔNG in mã code ra console — chỉ in SĐT đã che.
 * Tham khảo: https://developers.esms.vn/en/esms-api/other-apis/send-fixed-number-using-get
 */
export class EsmsOtpProvider implements OtpProvider {
  private readonly logger = new Logger(EsmsOtpProvider.name);
  private readonly endpoint = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get';

  constructor(
    private readonly apiKey: string,
    private readonly secretKey: string,
    private readonly brandname: string,
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const params = new URLSearchParams({
      Phone: phone,
      Content: `Ma OTP LocHerbal cua ban la ${code}. Co hieu luc trong 5 phut.`,
      ApiKey: this.apiKey,
      SecretKey: this.secretKey,
      Brandname: this.brandname,
      SmsType: '8',
      IsUnicode: '1',
      RequestId: `otp-${Date.now()}`,
    });

    const response = await fetch(`${this.endpoint}?${params.toString()}`, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`ESMS API HTTP ${response.status}: ${await response.text()}`);
    }

    const result = (await response.json()) as { CodeResult?: string; ErrorMessage?: string };
    if (result.CodeResult !== '100') {
      throw new Error(`ESMS API error ${result.CodeResult}: ${result.ErrorMessage ?? 'unknown'}`);
    }

    this.logger.log(`[SMS OTP] Đã gửi OTP tới ${this.maskPhone(phone)}`);
  }

  private maskPhone(phone: string): string {
    if (phone.length < 5) return '***';
    return `${phone.slice(0, 3)}***${phone.slice(-2)}`;
  }
}

/**
 * Chỉ dùng khi SMS_PROVIDER=mock (dev/test). KHÔNG in mã code — mã chỉ tồn tại
 * trong bảng otp_codes (DB dev) để debug khi cần.
 */
export class MockOtpProvider implements OtpProvider {
  private readonly logger = new Logger(MockOtpProvider.name);
  async sendOtp(phone: string, _code: string): Promise<void> {
    this.logger.log(`[MOCK OTP] Gửi OTP tới SĐT: ${phone} (mã chỉ lưu trong DB dev)`);
  }
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly provider: OtpProvider;

  constructor(private readonly prisma: PrismaService) {
    const provider = process.env.SMS_PROVIDER;

    if (provider === 'esms') {
      const apiKey = process.env.SMS_PROVIDER_API_KEY;
      const secretKey = process.env.SMS_PROVIDER_SECRET_KEY;
      const brandname = process.env.SMS_BRANDNAME;
      if (!apiKey || !secretKey || !brandname) {
        throw new Error(
          'FATAL: SMS_PROVIDER=esms nhưng thiếu SMS_PROVIDER_API_KEY / SMS_PROVIDER_SECRET_KEY / SMS_BRANDNAME.',
        );
      }
      this.provider = new EsmsOtpProvider(apiKey, secretKey, brandname);
    } else if (provider === 'mock') {
      this.provider = new MockOtpProvider();
    } else {
      throw new Error(`FATAL: SMS_PROVIDER không hợp lệ hoặc chưa cấu hình: ${provider ?? '(rỗng)'}`);
    }
  }

  async generateAndSendOtp(phone: string, purpose: 'login' | 'register'): Promise<void> {
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

    // KHÔNG bao giờ trả mã OTP qua response — kể cả dev. Debug local:
    // đọc trực tiếp bảng otp_codes trong DB dev (code lưu dạng bcrypt hash).
    await this.provider.sendOtp(phone, code);
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

      throw new BadRequestException('Mã OTP không chính xác. Vui lòng thử lại.');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: now },
    });

    return true;
  }
}
