'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: '📋' },
  { href: '/dashboard/categories', label: 'Categories', icon: '🏷️' },
  { href: '/dashboard/import', label: 'Import', icon: '📥' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

export default function Nav() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex sticky top-0 h-screen w-56 shrink-0 flex-col border-r border-white/10 bg-[#0f1117] px-4 py-6">
        <Link href="/dashboard" className="mb-8 text-lg font-bold text-indigo-400">
          SubTracker
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === l.href
                  ? 'bg-indigo-500/15 font-medium text-indigo-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
        >
          <span>🚪</span>
          Sign out
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#0f1117] pb-safe">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] transition-colors ${
              pathname === l.href ? 'text-indigo-400' : 'text-gray-500'
            }`}
          >
            <span className="text-xl leading-none">{l.icon}</span>
            {l.label}
          </Link>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] text-gray-500"
        >
          <span className="text-xl leading-none">🚪</span>
          Sign out
        </button>
      </nav>
    </>
  )
}
