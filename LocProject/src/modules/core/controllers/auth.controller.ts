import { Controller, Post, Body, Res, Req, Get, Patch, UseGuards, UnauthorizedException, BadRequestException, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../decorators/user.decorator';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Public } from '../decorators/public.decorator';
import { RequestOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Throttle({ default: { limit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 3), ttl: 600000 } })
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 200, description: 'Đăng ký thành công' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy CSRF token cho browser cross-origin' })
  @ApiResponse({ status: 200, description: 'Trả csrf_token để gắn header x-csrf-token' })
  /**
   * setCsrfCookie middleware đã đảm bảo cookie csrf_token tồn tại trước khi vào đây.
   * GET là SAFE_METHOD nên không bị chặn; SOP + CORS hạn chế origin → token an toàn.
   */
  async getCsrfToken(@Req() request: Request) {
    return { csrfToken: request.cookies?.['csrf_token'] ?? '' };
  }

  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực email qua link (token) gửi trong email' })
  @ApiResponse({ status: 200, description: 'Xác thực email thành công' })
  @ApiResponse({ status: 400, description: 'Link không hợp lệ hoặc hết hạn' })
  async verifyEmail(@Query('token') token?: string) {
    if (!token) {
      throw new BadRequestException('Thiếu token xác thực');
    }
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi lại link xác thực email (tối đa 1 lần/phút)' })
  @ApiResponse({ status: 200, description: 'Link xác thực đã được gửi lại' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu qua email (tối đa 3 lần/giờ)' })
  @ApiResponse({ status: 200, description: 'Message trung lập — không lộ email tồn tại hay không' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token từ email' })
  @ApiResponse({ status: 200, description: 'Mật khẩu đã được đặt lại' })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Throttle({ default: { limit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 5), ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về accessToken + user', schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', user: { id: 'user-uuid', email: 'user@example.com', fullName: 'Nguyễn Văn A', phone: '0912345678', roles: ['customer'] } } } })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không chính xác' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(dto);

    this.setRefreshTokenCookie(response, refreshToken);

    return { accessToken, user };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu gửi mã OTP qua SĐT' })
  @ApiResponse({ status: 200, description: 'Yêu cầu gửi mã thành công' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    // KHÔNG trả mã OTP qua response — kể cả dev (mã chỉ có trong DB + tin nhắn SMS).
    await this.authService.requestOtp(dto.phone, dto.purpose);
    return {
      message: 'Mã OTP đã được gửi thành công',
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực OTP và đăng nhập/đăng ký SĐT' })
  @ApiResponse({ status: 200, description: 'Xác thực thành công, trả về accessToken' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.verifyOtp(dto.phone, dto.code, dto.purpose);

    this.setRefreshTokenCookie(response, refreshToken);

    return { accessToken, user };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin profile hiện tại' })
  async me(@User('userId') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân (họ tên, SĐT)' })
  async updateProfile(@User('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 401, description: 'Mật khẩu hiện tại không chính xác' })
  async changePassword(@User('userId') userId: string, @User('jti') jti: string | undefined, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto, jti);
  }

  @Public()
  @Throttle({ default: { limit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 5), ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không tìm thấy');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.rotateTokens(refreshToken);

    this.setRefreshTokenCookie(response, newRefreshToken);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.['refresh_token'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      path: '/',
    });

    return { message: 'Đăng xuất thành công' };
  }

  /**
   * SPA + API deploy trên 2 subdomain khác nhau (VD Railway `*.up.railway.app`,
   * nằm trong Public Suffix List) là 2 SITE khác nhau → cookie SameSite=Strict
   * không được browser gửi cross-site → refresh token "bốc hơi". Khi NODE_ENV=production
   * (HTTPS) phải dùng SameSite=None và dựa vào Origin check của csrfGuard để chặn CSRF.
   * Trong dev (localhost:3000 → :4000 là cùng site) giữ Strict cho an toàn.
   */
  private setRefreshTokenCookie(response: Response, token: string) {
    const secure = process.env.NODE_ENV === 'production';
    response.cookie('refresh_token', token, {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
