import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy (Next.js middleware) — hiện là pass-through vì không thể xác thực server-side
 * trong topology cross-site (frontend & backend là 2 site khác nhau, VD Railway
 * `*.up.railway.app` nằm trong Public Suffix List):
 * - refresh_token cookie là host-only của BACKEND domain → browser không bao giờ gửi
 *   nó lên FRONTEND server → đọc request.cookies.get('refresh_token') luôn undefined
 *   → mọi route bảo vệ bị redirect về /login dù đã đăng nhập.
 *
 * Route protection được chuyển sang CLIENT-SIDE (guard component chờ zustand hydrate
 * xong rồi mới redirect). Dữ liệu nhạy cảm vẫn được bảo vệ bởi backend (JWT + RolesGuard).
 * Khi triển khai same-site (VD locherbal.com + Domain=.locherbal.com cho cookie), có thể
 * khôi phục lại auth-gate server-side tại đây.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/checkout/:path*',
    '/orders/:path*',
  ],
};
