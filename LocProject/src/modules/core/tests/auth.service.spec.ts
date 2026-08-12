// Phải set env TRƯỚC khi import AuthService, vì requireEnv() chạy lúc runtime
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { EmailService } from '../services/email.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      create: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    otpCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockOtpService = {
    generateAndSendOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
  };

  function mockUser(overrides: Record<string, any> = {}) {
    return {
      id: 'user-1',
      email: 'test@test.com',
      passwordHash: '',
      fullName: 'Test User',
      phone: null,
      roles: [],
      ...overrides,
    };
  }

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: OtpService, useValue: mockOtpService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw error if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'test@test.com', password: '123' }))
        .rejects
        .toThrow('Email hoặc mật khẩu không chính xác');
    });

    it('should throw same error message for wrong password as for user not found', async () => {
      const hash = await bcrypt.hash('correct_password', 10);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser({ passwordHash: hash }));

      await expect(service.login({ email: 'test@test.com', password: 'wrong_password' }))
        .rejects
        .toThrow('Email hoặc mật khẩu không chính xác');
    });

    it('should return tokens if login success', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser({ passwordHash: hash }));
      mockJwtService.sign.mockReturnValue('token_string');

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.userSession.create).toHaveBeenCalled();
    });

    it('should store bcrypt-hashed token in UserSession, not raw token', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser({ passwordHash: hash }));
      mockJwtService.sign
        .mockReturnValueOnce('access_token_val')
        .mockReturnValueOnce('refresh_token_val');

      const result = await service.login({ email: 'test@test.com', password: 'password123' });
      expect(result.refreshToken).toBe('refresh_token_val');

      const createCall = mockPrismaService.userSession.create.mock.calls[0][0];
      const storedHashedToken = createCall.data.hashedToken;

      expect(storedHashedToken).not.toBe('refresh_token_val');
      const isMatch = await bcrypt.compare('refresh_token_val', storedHashedToken);
      expect(isMatch).toBe(true);
    });
  });

  describe('rotateTokens', () => {
    it('should throw Unauthorized if token not found in db', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1' });
      mockPrismaService.userSession.findUnique.mockResolvedValue(null);

      await expect(service.rotateTokens('some_token'))
        .rejects
        .toThrow('Session không tồn tại');
    });

    it('should revoke all and throw error if token is already revoked (replay attack)', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1' });
      const hashed = await bcrypt.hash('some_token', 10);

      mockPrismaService.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        jti: 'jti-1',
        hashedToken: hashed,
        isRevoked: true, // Bị revoke
        userId: 'user-1',
      });

      await expect(service.rotateTokens('some_token'))
        .rejects
        .toThrow('Cảnh báo bảo mật: Token đã được sử dụng!');

      expect(mockPrismaService.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { isRevoked: true },
      });
    });

    it('should rotate token successfully', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1' });
      const hashed = await bcrypt.hash('valid_token', 10);

      // generateTokens now queries user for roles
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser());

      mockPrismaService.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        jti: 'jti-1',
        hashedToken: hashed,
        isRevoked: false,
        userId: 'user-1',
      });
      mockJwtService.sign.mockReturnValue('new_token');

      const result = await service.rotateTokens('valid_token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true },
      });
    });
  });

  describe('changePassword', () => {
    it('should throw Unauthorized if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.changePassword('user-1', { currentPassword: 'old', newPassword: 'new12345' }),
      ).rejects.toThrow('User không tồn tại');
    });

    it('should throw Unauthorized if current password is wrong', async () => {
      const hash = await bcrypt.hash('correct_old', 10);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser({ passwordHash: hash }));

      await expect(
        service.changePassword('user-1', { currentPassword: 'wrong_old', newPassword: 'new12345' }),
      ).rejects.toThrow('Mật khẩu hiện tại không chính xác');
    });

    it('should change password successfully', async () => {
      const hash = await bcrypt.hash('correct_old', 10);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser({ passwordHash: hash }));
      mockPrismaService.user.update.mockResolvedValue(mockUser());
      mockPrismaService.userSession.updateMany.mockResolvedValue({ count: 1 });

      // changePassword chạy trong $transaction — mock tx trỏ về các method của mockPrismaService
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: mockPrismaService.user,
          userSession: mockPrismaService.userSession,
        };
        return cb(tx);
      });

      const result = await service.changePassword('user-1', { currentPassword: 'correct_old', newPassword: 'new12345' });
      expect(result).toEqual({ message: 'Đổi mật khẩu thành công' });

      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      const newHash = updateCall.data.passwordHash;
      expect(newHash).not.toBe(hash);
      const isMatch = await bcrypt.compare('new12345', newHash);
      expect(isMatch).toBe(true);

      // Revoke tất cả session khác (trừ session đang đổi mật khẩu nếu có jti)
      expect(mockPrismaService.userSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isRevoked: true } }),
      );
    });

    it('should revoke all other sessions but keep current jti', async () => {
      const hash = await bcrypt.hash('correct_old', 10);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser({ passwordHash: hash }));
      mockPrismaService.userSession.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        return cb({ user: mockPrismaService.user, userSession: mockPrismaService.userSession });
      });

      await service.changePassword('user-1', { currentPassword: 'correct_old', newPassword: 'new12345' }, 'jti-current');

      expect(mockPrismaService.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', jti: { not: 'jti-current' }, isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  describe('logout', () => {
    it('should be idempotent', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1' });
      mockPrismaService.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        jti: 'jti-1',
        isRevoked: false,
      });

      await expect(service.logout('valid_token')).resolves.not.toThrow();
      expect(mockPrismaService.userSession.update).toHaveBeenCalled();

      mockPrismaService.userSession.findUnique.mockResolvedValue(null);
      mockPrismaService.userSession.update.mockClear();

      await expect(service.logout('valid_token')).resolves.not.toThrow();
      expect(mockPrismaService.userSession.update).not.toHaveBeenCalled();
    });
  });

  describe('OTP request', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should reject when purpose=login but phone not registered', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.requestOtp('0912345678', 'login')).rejects.toThrow(
        'Số điện thoại chưa đăng ký, vui lòng đăng ký trước',
      );
      expect(mockOtpService.generateAndSendOtp).not.toHaveBeenCalled();
    });

    it('should reject when purpose=register but phone already registered', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser({ phone: '0912345678' }));

      await expect(service.requestOtp('0912345678', 'register')).rejects.toThrow(
        'Số điện thoại đã được đăng ký',
      );
      expect(mockOtpService.generateAndSendOtp).not.toHaveBeenCalled();
    });

    it('should send OTP when purpose=login and phone exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser({ phone: '0912345678' }));
      mockOtpService.generateAndSendOtp.mockResolvedValue('123456');

      const result = await service.requestOtp('0912345678', 'login');
      expect(result).toBe('123456');
      expect(mockOtpService.generateAndSendOtp).toHaveBeenCalledWith('0912345678', 'login');
    });

    it('should reject invalid phone format', async () => {
      await expect(service.requestOtp('12345', 'login')).rejects.toThrow('không đúng định dạng');
      expect(mockPrismaService.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('OTP verify', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockJwtService.sign.mockReturnValue('otp_access_token');
      mockPrismaService.userSession.create.mockResolvedValue({ id: 'sess' });
    });

    it('purpose=login: should issue tokens for existing user', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser({ phone: '0912345678' }));

      const result = await service.verifyOtp('0912345678', '123456', 'login');
      expect(result.accessToken).toBe('otp_access_token');
      expect(result.user.email).toBe('test@test.com');
      expect(mockPrismaService.userSession.create).toHaveBeenCalled();
    });

    it('purpose=login: phone not registered → error', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp('0912345678', '123456', 'login')).rejects.toThrow(
        'Số điện thoại chưa đăng ký',
      );
    });

    it('purpose=register: creates User + Customer in one transaction', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(
        mockUser({ id: 'new-user-1', email: '0912345678@locherbal.local', phone: '0912345678' }),
      );

      const tx = {
        user: mockPrismaService.user,
        customer: mockPrismaService.customer,
      };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const result = await service.verifyOtp('0912345678', '123456', 'register');
      expect(result.accessToken).toBe('otp_access_token');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'new-user-1' }) }),
      );
    });
  });

  describe('register (email/password)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should reject if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser({ email: 'dup@test.com' }));

      await expect(
        service.register({ email: 'dup@test.com', password: 'password123', fullName: 'Dup' }),
      ).rejects.toThrow('Email đã được sử dụng');

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should create user + customer, and send verification email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(
        mockUser({ id: 'new-user-1', email: 'new@test.com', fullName: 'New User' }),
      );

      const tx = {
        user: mockPrismaService.user,
        customer: mockPrismaService.customer,
      };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        fullName: 'New User',
      });

      expect(result).toEqual({ id: 'new-user-1', email: 'new@test.com', fullName: 'New User' });

      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      expect(createCall.data.emailVerified).toBe(false);
      expect(createCall.data.emailVerificationToken).toBeTruthy();
      expect(createCall.data.emailVerificationExpiry).toBeInstanceOf(Date);

      expect(mockPrismaService.customer.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'new@test.com',
        'New User',
        expect.any(String),
      );
    });

    it('should still return user if email sending fails (not block registration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser({ id: 'new-user-1' }));
      const tx = { user: mockPrismaService.user, customer: mockPrismaService.customer };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockEmailService.sendVerificationEmail.mockRejectedValue(new Error('Resend down'));

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        fullName: 'New User',
      });
      expect(result.id).toBe('new-user-1');
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw if token not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.verifyEmail('bad-token')).rejects.toThrow('Link xác thực không hợp lệ');
    });

    it('should throw if already verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        mockUser({ emailVerified: true }),
      );
      await expect(service.verifyEmail('token')).rejects.toThrow('Email đã được xác thực trước đó');
    });

    it('should throw if expired', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        mockUser({
          emailVerified: false,
          emailVerificationExpiry: new Date(Date.now() - 1000),
        }),
      );
      await expect(service.verifyEmail('token')).rejects.toThrow('Link xác thực đã hết hạn');
    });

    it('should set emailVerified and clear token on success', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        mockUser({
          emailVerified: false,
          emailVerificationExpiry: new Date(Date.now() + 60 * 60 * 1000),
          emailVerificationToken: 'token',
        }),
      );
      mockPrismaService.user.update.mockResolvedValue(mockUser());

      const result = await service.verifyEmail('token');
      expect(result).toEqual({ message: 'Xác thực email thành công' });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });
    });
  });

  describe('resendVerificationEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return generic message if user not found (do not leak)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.resendVerificationEmail('ghost@test.com');
      expect(result.message).toContain('Nếu email tồn tại');
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw if already verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser({ emailVerified: true }));
      await expect(service.resendVerificationEmail('test@test.com')).rejects.toThrow(
        'Email đã được xác thực',
      );
    });

    it('should generate new token and send email', async () => {
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);
      mockPrismaService.user.findUnique.mockResolvedValue(
        mockUser({ emailVerified: false, fullName: 'Test User' }),
      );
      mockPrismaService.user.update.mockResolvedValue(mockUser());

      const result = await service.resendVerificationEmail('test@test.com');
      expect(result.message).toContain('được gửi lại');

      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      expect(updateCall.data.emailVerificationToken).toBeTruthy();
      expect(updateCall.data.emailVerificationExpiry).toBeInstanceOf(Date);

      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@test.com',
        'Test User',
        updateCall.data.emailVerificationToken,
      );
    });
  });
});
