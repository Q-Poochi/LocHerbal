import type { NextConfig } from "next";

// CSP connect-src phải cho phép API backend (cross-origin fetch).
// Dùng env NEXT_PUBLIC_API_URL để tự cập nhật khi trỏ domain thật (api.locherbal.com).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      // provinces.open-api.vn: API địa chỉ VN dùng ở checkout + account (dropdown tỉnh/quận).
      // Thiếu domain này trong connect-src → browser chặn fetch → dropdown tỉnh rỗng.
      `connect-src 'self' ${API_URL} http://localhost:4000 https://provinces.open-api.vn`,
      "font-src 'self' https: data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' blob: data: https:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline' https:",
      "upgrade-insecure-requests",
    ].join('; '),
  },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'X-Download-Options', value: 'noopen' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  });
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
    // Chỉ tắt optimization ở local dev (không có server image optimizer chạy cùng).
    // Production (NODE_ENV=production) để Next tự tối ưu: WebP/AVIF + resize + preload.
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
