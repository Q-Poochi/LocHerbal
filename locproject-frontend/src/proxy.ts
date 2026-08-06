import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('refresh_token')?.value;

    const redirectToLogin = (redirectPath: string) => {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', redirectPath);
        return NextResponse.redirect(loginUrl);
    };

    // Không có token -> Redirect về /login, kèm redirect để sau login quay lại
    if (!token) {
        return redirectToLogin(pathname);
    }

    // Route admin bắt buộc phải là admin
    if (pathname.startsWith('/admin')) {
        try {
            const { payload } = await jwtVerify(token, REFRESH_SECRET);
            const roles: string[] = (payload.roles as string[] | undefined) || [];
            if (!roles.includes('admin')) {
                // Đã đăng nhập nhưng không phải admin -> về trang chủ
                return NextResponse.redirect(new URL('/', request.url));
            }
        } catch {
            // Token không hợp lệ / hết hạn -> đăng nhập lại
            return redirectToLogin(pathname);
        }
    }

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
