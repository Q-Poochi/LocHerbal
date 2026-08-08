import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * CSRF token cookie middleware: tạo cookie nếu chưa có (chạy TRƯỚC CSRF check).
 */
export function setCsrfCookie(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.['csrf_token']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
  next();
}

/**
 * CSRF double-submit cookie pattern — fail-closed cho browser, thân thiện cho API client.
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.includes(req.method)) return next();

  const secFetchSite = req.headers['sec-fetch-site'] as string | undefined;
  if (secFetchSite === 'same-origin' || secFetchSite === 'none') return next();

  const csrfCookie = req.cookies?.['csrf_token'];
  const csrfHeader = req.headers?.['x-csrf-token'] as string;
  const match = csrfCookie && csrfHeader && csrfCookie === csrfHeader;
  if (match) return next();

  // Request có "dấu hiệu trình duyệt" (Sec-Fetch-Site / Origin) HOẶC có CSRF cookie
  // → phải khớp double-submit, nếu không thì TỪ CHỐI (fail-closed).
  const browserLike = !!secFetchSite || !!req.headers['origin'];
  if (browserLike || csrfCookie) {
    res.status(403).json({ statusCode: 403, message: 'CSRF token không hợp lệ', error: 'Forbidden' });
    return;
  }

  // Client không cookie, không dấu browser (curl, k6, server-to-server, mobile)
  // → không có ambient session để bị CSRF, cho qua.
  next();
}