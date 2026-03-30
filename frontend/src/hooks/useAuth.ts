'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'
import { useDataStore } from '@/store/dataStore'

export function useAuth(protect = false) {
  const { token, ready, setAuth, clearAuth } = useAuthContext()
  const router = useRouter()
  const reset = useDataStore(s => s.reset)

  useEffect(() => {
    if (!ready) return
    if (protect && !token) router.replace('/login')
  }, [ready, protect, token, router])

  function login(t: string, refreshToken?: string) {
    setAuth(t, refreshToken)
    router.push('/dashboard')
  }

  function logout() {
    clearAuth()
    reset()
    router.push('/login')
  }

  return { token, ready, login, logout }
}
