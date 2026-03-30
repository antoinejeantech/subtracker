import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'

export const metadata: Metadata = {
  title: 'SubTracker',
  description: 'Track your subscriptions',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
