import type { Metadata } from 'next';
import { Montserrat, Noto_Sans_KR, Noto_Serif_KR, Playfair_Display, Yeon_Sung } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
});

const notoSans = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  display: 'swap',
  preload: false,
});

const notoSerif = Noto_Serif_KR({
  variable: '--font-noto-serif-kr',
  display: 'swap',
  preload: false,
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const yeonSung = Yeon_Sung({
  weight: '400',
  variable: '--font-yeon-sung',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Pack to Go — 여행을 기록하는 방식',
  description: '함께 계획한 여행을 한 장의 기록으로 남겨보세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${montserrat.variable} ${notoSans.variable} ${notoSerif.variable} ${playfair.variable} ${yeonSung.variable} antialiased h-full`}
    >
      <body className="editorial-body min-h-[100dvh]">
        <AuthGuard>
          <Navbar />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
