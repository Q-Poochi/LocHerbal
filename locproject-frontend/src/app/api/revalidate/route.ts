import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * POST /api/revalidate — bust Data Cache của Next.js theo tag.
 *
 * Xác thực: forward Authorization header lên backend GET /auth/me —
 * CHỈ user có role admin mới được gọi. Không cần secret riêng, JWT
 * vẫn sống phía client (RAM) và backend là điểm xác thực duy nhất.
 *
 * Body: { tags: string[] } — ví dụ ["products", "product:cao-atiso-sapa"]
 */
export async function POST(request: NextRequest) {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: authorization },
            cache: 'no-store',
        });
        if (!meRes.ok) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const me = await meRes.json();
        const roles: string[] = Array.isArray(me?.roles)
            ? me.roles
            : me?.role
                ? [me.role]
                : [];
        if (!roles.includes('admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: 'Auth check failed' }, { status: 502 });
    }

    const body = await request.json().catch(() => null);
    const rawTags: unknown = body?.tags;
    const tags = Array.isArray(rawTags)
        ? rawTags.filter(
              (t): t is string =>
                  typeof t === 'string' && t.length > 0 && t.length <= 100,
          )
        : [];
    if (tags.length === 0) {
        return NextResponse.json({ error: 'tags[] required' }, { status: 400 });
    }

    for (const tag of tags) {
        // Next 16: profile "{ expire: 0 }" = hết hạn ngay lập tức
        revalidateTag(tag, { expire: 0 });
    }

    return NextResponse.json({ revalidated: true, tags });
}