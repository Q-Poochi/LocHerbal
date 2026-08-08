import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, OptionalJwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  describe('isPublic (reflection)', () => {
    it('should return true for @Public endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const result = (guard as any).canActivate({
        getHandler: () => ({}),
        getClass: () => ({}),
      });
      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException when no user', () => {
      expect(() => (guard as any).handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw original error when err present', () => {
      const err = new Error('boom');
      expect(() => (guard as any).handleRequest(err, null, null)).toThrow('boom');
    });

    it('should return user when valid', () => {
      const user = { userId: 'u1' };
      expect((guard as any).handleRequest(null, user, null)).toBe(user);
    });
  });
});

describe('OptionalJwtAuthGuard', () => {
  it('should return null for unauthenticated', () => {
    const g = new OptionalJwtAuthGuard();
    expect((g as any).handleRequest(null, null, null)).toBeNull();
  });

  it('should return user when authenticated', () => {
    const g = new OptionalJwtAuthGuard();
    const user = { userId: 'u1' };
    expect((g as any).handleRequest(null, user, null)).toBe(user);
  });
});