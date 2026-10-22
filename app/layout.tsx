import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '북튜닝 (Book Tuning) - 개인 독서 챌린지',
  description: '1주 1권 챌린지 및 노션 연동 스마트 독서 서재',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '북튜닝',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8f5f36',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
