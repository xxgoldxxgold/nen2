import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
