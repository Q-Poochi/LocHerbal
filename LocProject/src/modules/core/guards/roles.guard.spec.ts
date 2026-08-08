import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const makeContext = (user: any, rolesMeta: string[] | undefined): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    expect(guard.canActivate(makeContext({ roles: ['admin'] }, []))).toBe(true);
  });

  it('should deny when user missing roles array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    expect(guard.canActivate(makeContext({}, ['admin']))).toBe(false);
  });

  it('should allow when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    expect(guard.canActivate(makeContext({ roles: ['admin'] }, ['admin']))).toBe(true);
  });

  it('should deny when user role does NOT match (case-sensitive)', () => {
    // Roles trong JWT là lowercase ('admin'); nếu yêu cầu 'ADMIN' thì KHÔNG khớp
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(guard.canActivate(makeContext({ roles: ['admin'] }, ['ADMIN']))).toBe(false);
  });

  it('should deny when user has UPPERCASE role but endpoint requires lowercase', () => {
    // Bug cụ thể từng gây lỗi thật trong dự án: user có role 'ADMIN' (hoặc DB trả 'ADMIN')
    // nhưng @Roles('admin') lại không thể truy cập → gọi kiểu uppercase là rule
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    expect(guard.canActivate(makeContext({ roles: ['ADMIN'] }, ['admin']))).toBe(false);
  });

  it('should deny when user has a different role entirely', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['staff']);
    expect(guard.canActivate(makeContext({ roles: ['admin'] }, ['staff']))).toBe(false);
  });

  it('should allow when ANY required role matches', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['staff', 'admin']);
    expect(guard.canActivate(makeContext({ roles: ['admin'] }, ['staff', 'admin']))).toBe(true);
  });
});