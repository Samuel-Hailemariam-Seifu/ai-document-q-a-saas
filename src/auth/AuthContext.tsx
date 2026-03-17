import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearStoredTokens, getStoredTokens } from './tokens'
import { me, type User } from '../services/auth'

type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User }

type AuthContextValue = {
  state: AuthState
  refreshMe: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  const refreshMe = useCallback(async () => {
    const tokens = getStoredTokens()
    if (!tokens) {
      setState({ status: 'anonymous' })
      return
    }
    try {
      const user = await me()
      setState({ status: 'authenticated', user })
    } catch {
      clearStoredTokens()
      setState({ status: 'anonymous' })
    }
  }, [])

  const logout = useCallback(() => {
    clearStoredTokens()
    setState({ status: 'anonymous' })
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const value = useMemo<AuthContextValue>(
    () => ({ state, refreshMe, logout }),
    [state, refreshMe, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

