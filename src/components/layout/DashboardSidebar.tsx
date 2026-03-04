'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  Palette,
  Settings,
  BarChart3,
  LogOut,
  Sparkles,
  Lightbulb,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/dashboard/posts/new', label: '新規作成', icon: PenSquare },
  { href: '/dashboard/ai-context', label: 'AIコンテキスト', icon: Sparkles },
  { href: '/dashboard/design', label: 'デザイン', icon: Palette },
  { href: '/dashboard/suggestions', label: '改善提案', icon: Lightbulb },
  { href: '/dashboard/analytics', label: 'アクセス解析', icon: BarChart3 },
  { href: '/dashboard/settings', label: '設定', icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navContent = (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="NEN2" width={28} height={28} className="h-7 w-7" />
          <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
            NEN2
          </Link>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href) &&
              !navItems.some(other => other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 px-3 py-4 dark:border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LogOut className="h-5 w-5" />
          ログアウト
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-700 dark:bg-gray-900">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Image src="/logo.png" alt="NEN2" width={24} height={24} className="h-6 w-6" />
        <span className="text-sm font-bold text-gray-900 dark:text-white">NEN2</span>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — desktop: fixed, mobile: slide-in drawer */}
      <aside
        className={`fixed top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:relative md:translate-x-0 dark:border-gray-700 dark:bg-gray-900 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  )
}
