import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEN2 - AIの力でブログを始めよう",
  description: "NEN2はAIをフル活用した次世代ブログホスティングサービス。言葉を入れるだけでブログが完成する体験を提供します。",
  openGraph: {
    title: "NEN2 - AIの力でブログを始めよう",
    description: "NEN2は記事作成・デザイン・集客の全工程でAIが支援する、AIネイティブ設計のブログプラットフォーム。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
