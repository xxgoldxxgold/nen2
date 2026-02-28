'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  PenSquare,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/dashboard/new', label: '新規記事', icon: PenSquare },
  { href: '/dashboard/settings', label: '設定', icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xl font-bold text-gray-900 dark:text-white">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          NEN2
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard' || pathname.startsWith('/dashboard/edit')
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  )
}
