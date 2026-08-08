import { csrfGuard, setCsrfCookie } from '../middleware/csrf.middleware';
import { Request, Response, NextFunction } from 'express';

describe('CSRF middleware', () => {
  function makeReq(overrides: Partial<Request> = {}): Partial<Request> {
    return {
      method: 'POST',
      headers: {},
      cookies: {},
      ...overrides,
    };
  }

  function makeRes() {
    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: any) {
        this.body = body;
        return this;
      },
      cookie: jest.fn(),
      getHeader: jest.fn(),
    };
    return res;
  }

  describe('safe methods', () => {
    it('should let GET pass without token', () => {
      const req = makeReq({ method: 'GET' });
      const res = makeRes();
      const next: NextFunction = jest.fn();
      csrfGuard(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('same-origin request', () => {
    it('should pass when Sec-Fetch-Site is same-origin', () => {
      const req = makeReq({ headers: { 'sec-fetch-site': 'same-origin' } });
      const res = makeRes();
      const next: NextFunction = jest.fn();
      csrfGuard(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('cross-site browser (CSRF vector)', () => {
    it('should REJECT cross-site POST with cookie but no header -> 403', () => {
      const req = makeReq({
        headers: { 'sec-fetch-site': 'cross-site', origin: 'http://evil.com' },
        cookies: { csrf_token: 'abc' },
      });
      const res = makeRes();
      const next: NextFunction = jest.fn();
      csrfGuard(req as Request, res as Response, next);
      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should REJECT cross-site POST with no cookie, no match -> 403', () => {
      const req = makeReq({
        headers: { 'sec-fetch-site': 'cross-site', origin: 'https://evil.com' },
      });
      const res = makeRes();
      const next: NextFunction = jest.fn();
      csrfGuard(req as Request, res as Response, next);
      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('double-submit match', () => {
    it('should PASS when cookie and header match', () => {
      const req = makeReq({
        headers: { 'sec-fetch-site': 'cross-site', 'x-csrf-token': 'secret-token' },
        cookies: { csrf_token: 'secret-token' },
      });
      const res = makeRes();
      const next: NextFunction = jest.fn();
      csrfGuard(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('API client (no cookie, no browser headers)', () => {
    it('should PASS bare POST from curl/k6 (no ambient session)', () => {
      const req = makeReq(); // no cookies, no sec-fetch-site, no origin
      const res = makeRes();
      const next: NextFunction = jest.fn();
      csrfGuard(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('setCsrfCookie', () => {
    it('should set csrf_token cookie when missing', () => {
      const req = makeReq();
      const res = makeRes();
      const next: NextFunction = jest.fn();
      setCsrfCookie(req as Request, res as Response, next);
      expect(res.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: false, sameSite: 'strict' }),
      );
      expect(next).toHaveBeenCalled();
    });

    it('should NOT re-set cookie when already present', () => {
      const req = makeReq({ cookies: { csrf_token: 'existing' } });
      const res = makeRes();
      const next: NextFunction = jest.fn();
      setCsrfCookie(req as Request, res as Response, next);
      expect(res.cookie).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});