import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward to backend API
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${backendUrl}/support/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Support ticket proxy error:', error);
        return NextResponse.json(
            { message: 'Không thể kết nối đến máy chủ' },
            { status: 500 }
        );
    }
}