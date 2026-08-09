import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '../lib/providers/query-provider';
import { ToastProvider } from '../lib/providers/toast-provider';
import { AuthBootstrap } from '../lib/providers/auth-bootstrap';
import CartDrawer from '../components/storefront/CartDrawer';
import AuthDrawer from '../components/storefront/AuthDrawer';
import MobileBottomNav from '@/components/storefront/layout/MobileBottomNav';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
  display: 'optional',
});

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
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
    <html lang="vi" className={`${beVietnamPro.variable} ${inter.variable} h-full antialiased`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans pb-[60px] md:pb-0">
        <ReactQueryProvider>
          <ToastProvider>
            <AuthBootstrap />
            {children}
            <CartDrawer />
            <AuthDrawer />
            <MobileBottomNav />
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
