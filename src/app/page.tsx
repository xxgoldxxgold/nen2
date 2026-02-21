import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Wand2, Palette, BarChart3, Zap, Globe, PenSquare } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-lg dark:border-gray-800/50 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <Image src="/logo.png" alt="NEN2" width={28} height={28} className="h-7 w-7" />
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
            AIネイティブ設計のブログプラットフォーム
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            言葉を入れるだけで
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ブログが完成する
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            記事作成・デザイン・SEO対策の全工程でAIが支援。
            テクニカルな知識は不要です。今すぐ、あなただけのブログを始めましょう。
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
              AIがブログ運営の全てをサポート
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              記事を書くだけじゃない。デザインもSEOもAIにおまかせ。
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Wand2 className="h-6 w-6" />}
              title="AI記事生成"
              description="タイトルを入力するだけで、見出し構成から本文まで自動生成。トーンや文体も選択可能。"
              color="blue"
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="AIリライト"
              description="テキストを選択して「より簡潔に」「より詳しく」。AIがあなたの文章を磨き上げます。"
              color="purple"
            />
            <FeatureCard
              icon={<Palette className="h-6 w-6" />}
              title="AIデザイン"
              description="「もっとクールに」と話しかけるだけ。AIがブログのデザインを自動調整します。"
              color="pink"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="SEO自動最適化"
              description="記事を保存するたびにSEOスコアを算出。改善提案でGoogle上位表示を目指せます。"
              color="green"
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="高速配信"
              description="Next.jsベースのSSG/SSRで超高速表示。Vercelの世界中のCDNで配信。"
              color="yellow"
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="簡単公開"
              description="サブドメイン自動割り当て。カスタムドメインも対応。すぐにブログを公開できます。"
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">料金プラン</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">無料プランから始めて、成長に合わせてアップグレード</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <PricingCard
              name="Free"
              price="¥0"
              period=""
              features={[
                'ブログ1つ',
                '記事30件まで',
                'ストレージ 500MB',
                'AI機能（制限あり）',
                '基本テンプレート',
              ]}
              cta="無料で始める"
              ctaHref="/signup"
              highlighted={false}
            />
            <PricingCard
              name="Pro"
              price="¥980"
              period="/月"
              features={[
                'ブログ3つ',
                '記事数 無制限',
                'ストレージ 5GB',
                'AI機能 拡張',
                'カスタムドメイン',
                '広告非表示',
                '詳細アナリティクス',
              ]}
              cta="Proを始める"
              ctaHref="/signup"
              highlighted={true}
            />
            <PricingCard
              name="Business"
              price="¥2,980"
              period="/月"
              features={[
                'ブログ10個',
                '記事数 無制限',
                'ストレージ 50GB',
                'AI機能 フル',
                'カスタムドメイン',
                '広告非表示',
                '詳細アナリティクス + API',
              ]}
              cta="Businessを始める"
              ctaHref="/signup"
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            今すぐ、AIの力でブログを始めよう
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            登録は無料。クレジットカード不要。30秒で開始できます。
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
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <Image src="/logo.png" alt="NEN2" width={20} height={20} className="h-5 w-5" />
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

function PricingCard({
  name, price, period, features, cta, ctaHref, highlighted,
}: {
  name: string; price: string; period: string; features: string[]
  cta: string; ctaHref: string; highlighted: boolean
}) {
  return (
    <div className={`relative rounded-2xl border p-8 ${
      highlighted
        ? 'border-blue-600 bg-white shadow-xl shadow-blue-600/10 dark:bg-gray-900'
        : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
    }`}>
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
          人気
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
      <div className="mt-4">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
        <span className="text-sm text-gray-500">{period}</span>
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="h-4 w-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
          highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}
