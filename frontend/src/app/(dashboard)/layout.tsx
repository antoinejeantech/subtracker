'use client'

import { useAuth } from '@/hooks/useAuth'
import Nav from '@/components/Nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useAuth(true)

  if (!ready) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">
      <Nav />
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">{children}</main>
    </div>
  )
}
