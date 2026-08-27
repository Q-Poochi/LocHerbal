import { Injectable, Logger } from '@nestjs/common';

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}

/**
 * Gửi email qua Resend REST API (https://api.resend.com/emails).
 * Dùng fetch global (Node 22 hỗ trợ sẵn) — không cần cài thêm package.
 */
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) { }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend API error ${response.status}: ${body}`);
    }

    this.logger.log(`Đã gửi email "${subject}" tới ${to}`);
  }
}

/**
 * Chỉ dùng trong dev/test: log nội dung email ra console thay vì gửi thật.
 * Không bao giờ dùng provider này khi NODE_ENV=production.
 */
export class MockEmailProvider implements EmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] To=${to} | Subject=${subject}\n${html}`);
  }
}

@Injectable()
export class EmailService {
  private readonly provider: EmailProvider;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const apiKey = process.env.RESEND_API_KEY;

    if (isProduction && !apiKey) {
      throw new Error('FATAL: Chưa cấu hình RESEND_API_KEY cho production. Không được dùng mock email.');
    }

    // EMAIL_FROM dùng format chuẩn "LocHerbal <noreply@locherbal.com>"
    this.fromEmail = process.env.EMAIL_FROM || 'LocHerbal <noreply@locherbal.com>';
    this.frontendUrl = (process.env.FRONTEND_URL || process.env.API_URL || '').replace(/\/$/, '');
    this.provider = apiKey
      ? new ResendEmailProvider(apiKey, this.fromEmail)
      : new MockEmailProvider();
  }

  async sendVerificationEmail(to: string, fullName: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1b4332;">
        <h2 style="margin: 0 0 12px;">Xác thực email của bạn</h2>
        <p>Xin chào ${fullName},</p>
        <p>
          Bạn vừa đăng ký tài khoản LocHerbal. Vui lòng bấm nút bên dưới để xác thực email
          và hoàn tất đăng ký. Link có hiệu lực trong <strong>24 giờ</strong>.
        </p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 28px; background: #1b4332; color: #ffffff; text-decoration: none; border-radius: 8px;">Xác thực email</a>
        </p>
        <p style="font-size: 12px; color: #6b7c73;">
          Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
          Nếu nút trên không hoạt động, sao chép link: ${url}
        </p>
      </div>
    `;

    await this.provider.sendEmail(to, 'Xác thực email LocHerbal', html);
  }

  async sendPasswordResetEmail(to: string, fullName: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1b4332;">
        <h2 style="margin: 0 0 12px;">Đặt lại mật khẩu</h2>
        <p>Xin chào ${fullName},</p>
        <p>
          Bạn vừa yêu cầu đặt lại mật khẩu LocHerbal. Bấm nút bên dưới để tạo mật khẩu mới.
          Link có hiệu lực trong <strong>15 phút</strong>.
        </p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 28px; background: #1b4332; color: #ffffff; text-decoration: none; border-radius: 8px;">Đặt lại mật khẩu</a>
        </p>
        <p style="font-size: 12px; color: #6b7c73;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          Nếu nút trên không hoạt động, sao chép link: ${url}
        </p>
      </div>
    `;

    await this.provider.sendEmail(to, 'Đặt lại mật khẩu LocHerbal', html);
  }

  /**
   * Email xác nhận đã tiếp nhận đơn hàng — gửi NGAY sau khi checkout thành công
   * (cả COD lẫn VNPay). Lời hứa này hiển thị trên màn hình xác nhận đơn hàng,
   * nên bắt buộc phải có email tương ứng.
   */
  async sendOrderConfirmationEmail(
      to: string,
      fullName: string,
      data: {
          orderCode: string;
          orderId: string;
          items: { name: string; qty: number; subtotal: number }[];
          totalAmount: number;
      },
  ): Promise<void> {
      const detailUrl = `${this.frontendUrl}/orders/${data.orderId}`;
      const rows = data.items
          .map(
              (it) => `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e9efe9;">${it.name}</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e9efe9; text-align: center;">x${it.qty}</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e9efe9; text-align: right;">${it.subtotal.toLocaleString('vi-VN')}đ</td>
            </tr>`,
          )
          .join('');

      const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1b4332;">
        <h2 style="margin: 0 0 12px;">Cảm ơn bạn đã đặt hàng!</h2>
        <p>Xin chào ${fullName},</p>
        <p>
          Đơn hàng <strong>#${data.orderCode}</strong> của bạn đã được tiếp nhận và đang chờ xác nhận.
          Chi tiết như sau:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #1b4332;">Sản phẩm</th>
              <th style="padding: 8px 0; border-bottom: 2px solid #1b4332;">SL</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #1b4332;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="text-align: right; font-size: 16px; margin: 16px 0;">
          <strong>Tổng cộng: ${data.totalAmount.toLocaleString('vi-VN')}đ</strong>
        </p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${detailUrl}" style="display: inline-block; padding: 12px 28px; background: #1b4332; color: #ffffff; text-decoration: none; border-radius: 8px;">Xem chi tiết đơn hàng</a>
        </p>
        <p style="font-size: 12px; color: #6b7c73;">
          Nếu nút trên không hoạt động, sao chép link: ${detailUrl}
        </p>
      </div>
    `;

      await this.provider.sendEmail(to, `Xác nhận đơn hàng #${data.orderCode} — LocHerbal`, html);
  }
}