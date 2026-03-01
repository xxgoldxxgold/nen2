import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Wand2, BarChart3, Zap, Globe, PenSquare } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-lg dark:border-gray-800/50 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-bold text-gray-900 dark:text-white">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
            NEN2
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              ログイン
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Sparkles className="h-4 w-4" />
            AIファーストの設計のブログサービス
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              超シンプルなAIブログ
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            AIが支援、超シンプルで最高速ブログプラットフォーム。
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              <PenSquare className="h-5 w-5" />
              無料でブログを作成
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-gray-300 px-8 py-4 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              機能を詳しく見る
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              シンプル。高速。AI搭載。
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              超シンプルなデザインに、強力なAI機能を統合。
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Wand2 className="h-6 w-6" />}
              title="AI記事生成"
              description="タイトルを入力するだけで、Web検索に基づいた正確で充実した記事をMarkdownで自動生成。"
              color="blue"
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="AIリライト & 提案"
              description="テキスト選択でリライト。カーソル位置で続きを提案。AIがあなたの執筆をリアルタイムで支援。"
              color="purple"
            />
            <FeatureCard
              icon={<PenSquare className="h-6 w-6" />}
              title="エディタ"
              description="シンプルなエディタ。ツールバー、画像D&D、キーボードショートカット対応。"
              color="green"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="SEO分析 & タグ提案"
              description="AIがSEOスコアを算出し改善提案。タグも自動提案で、検索流入を最大化。"
              color="yellow"
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="高速配信"
              description="ISR + CDNで超高速表示。インラインCSS + セルフホストフォントで外部リクエストゼロ。"
              color="pink"
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="OGP & シェア"
              description="OGP画像自動生成、シェアボタン、サイトマップ。SNSでの拡散を後押し。"
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            今すぐ、AIの力でブログを始めよう
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            登録は無料。クレジットカード不要。
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            <Sparkles className="h-5 w-5" />
            無料で始める
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
              <Image src="/logo.png" alt="" width={25} height={25} className="h-[25px] w-[25px]" />
              NEN2
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/login" className="hover:text-gray-700 dark:hover:text-gray-300">ログイン</Link>
              <Link href="/signup" className="hover:text-gray-700 dark:hover:text-gray-300">新規登録</Link>
            </div>
            <p className="text-xs text-gray-400">
              &copy; 2026 NEN2. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon, title, description, color,
}: {
  icon: React.ReactNode; title: string; description: string; color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className={`inline-flex rounded-xl p-3 ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}
