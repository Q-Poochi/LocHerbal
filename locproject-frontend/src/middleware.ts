import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('refresh_token');

    // Các route public sẽ KHÔNG đi qua đây vì đã bị filter bởi matcher ở dưới.
    // Nên nếu đã vào được hàm này, nghĩa là đang ở route protected.
    // Nếu không có token -> Redirect về /login
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
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
