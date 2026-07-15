// Phải set env TRƯỚC khi import AuthService, vì requireEnv() chạy lúc runtime
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
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
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
      });

      await expect(service.login({ email: 'test@test.com', password: 'wrong_password' }))
        .rejects
        .toThrow('Email hoặc mật khẩu không chính xác');
    });

    it('should return tokens if login success', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
      });
      mockJwtService.sign.mockReturnValue('token_string');

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.userSession.create).toHaveBeenCalled();
    });

    it('should store bcrypt-hashed token in UserSession, not raw token', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
      });
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
});
