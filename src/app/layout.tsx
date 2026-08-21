import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Pack to Go - 여행 동반자',
  description: '여행을 계획하고 함께 추억을 공유하세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col bg-[#f5f5f9] text-slate-900">
        <AuthGuard>
          <Navbar />
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}
