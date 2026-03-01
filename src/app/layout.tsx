import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "700"],
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
    <html lang="ja" className={notoSansJP.className}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
