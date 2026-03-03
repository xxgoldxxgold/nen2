import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'NEN2 Design Spec System',
  description: 'ユーザー参加型デザイン仕様生成システム',
}

export default function DesignSpecLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
      }}>
        <Link href="/d" style={{ fontWeight: 700, fontSize: '18px', color: '#111', textDecoration: 'none' }}>
          NEN2 Design Spec
        </Link>
        <Link href="/d" style={{ fontSize: '14px', color: '#555', textDecoration: 'none' }}>
          投稿
        </Link>
        <Link href="/d/board" style={{ fontSize: '14px', color: '#555', textDecoration: 'none' }}>
          ボード
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/dashboard" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>
          ダッシュボードに戻る
        </Link>
      </nav>
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }}>
        {children}
      </main>
    </div>
  )
}
