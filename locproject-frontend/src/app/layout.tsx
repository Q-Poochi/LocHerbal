import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '../lib/providers/query-provider';
import { ToastProvider } from '../lib/providers/toast-provider';
import { AuthBootstrap } from '../lib/providers/auth-bootstrap';
import CartDrawer from '../components/storefront/CartDrawer';
import AuthDrawer from '../components/storefront/AuthDrawer';
import MobileBottomNav from '@/components/storefront/layout/MobileBottomNav';
import BotanicalBackground from '@/components/storefront/layout/BotanicalBackground';

// Be_Vietnam_Pro — fallback tiếng Việt dự phòng cho glyph thiếu
const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-be-vietnam',
  display: 'optional',
});

// Cormorant Garamond — serif cổ điển dùng cho TOÀN BỘ site (body + heading).
// 300 = light thanh mảnh (tên sản phẩm), 400/500 = body, 600/700 = heading đậm.
// Có subset tiếng Việt đầy đủ.
const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-cormorant',
  display: 'optional',
});

export const metadata: Metadata = {
  title: 'LocHerbal - Thảo dược thiên nhiên',
  description: 'Cửa hàng cung cấp thảo dược thiên nhiên, thực phẩm chức năng và sản phẩm chăm sóc sức khỏe uy tín.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        {/* Material Symbols được TỰ HOST trong /public/fonts — không dùng CDN
            Google Fonts lúc runtime để icon không bao giờ hiện text thô
            khi mạng không tải được stylesheet */}
      </head>
      <body className="min-h-full flex flex-col font-sans pb-[60px] md:pb-0 relative isolate">
        <BotanicalBackground />
        <div className="relative z-10 flex flex-col min-h-full flex-1">
          <ReactQueryProvider>
            <ToastProvider>
              <AuthBootstrap />
              {children}
              <CartDrawer />
              <AuthDrawer />
              <MobileBottomNav />
            </ToastProvider>
          </ReactQueryProvider>
        </div>
      </body>
    </html>
  );
}
