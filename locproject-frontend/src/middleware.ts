import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('refresh_token');

    // Các route public sẽ KHÔNG đi qua đây vì đã bị filter bởi matcher ở dưới.
    // Nên nếu đã vào được hàm này, nghĩa là đang ở route protected.
    // Nếu không có token -> Redirect về /login, kèm redirect để sau login quay lại
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
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
