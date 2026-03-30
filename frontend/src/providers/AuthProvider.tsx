'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getToken, setToken, clearAllTokens, setRefreshToken } from '@/lib/auth'

type AuthCtx = {
  token: string | null
  ready: boolean
  setAuth: (token: string, refreshToken?: string) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthCtx>({
  token: null,
  ready: false,
  setAuth: () => {},
  clearAuth: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setTokenState(getToken())
    setReady(true)
  }, [])

  const setAuth = useCallback((t: string, refreshToken?: string) => {
    setToken(t)
    if (refreshToken) setRefreshToken(refreshToken)
    setTokenState(t)
  }, [])

  const clearAuth = useCallback(() => {
    clearAllTokens()
    setTokenState(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, ready, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
