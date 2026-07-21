import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '../lib/providers/query-provider';
import { ToastProvider } from '../lib/providers/toast-provider';
import { AuthBootstrap } from '../lib/providers/auth-bootstrap';
import type { ReactNode } from 'react';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-be-vietnam-pro',
});

const inter = Inter({
  subsets: ['vietnamese', 'latin'],
  variable: '--font-inter',
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
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ReactQueryProvider>
          <ToastProvider>
            <AuthBootstrap />
            {children}
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
