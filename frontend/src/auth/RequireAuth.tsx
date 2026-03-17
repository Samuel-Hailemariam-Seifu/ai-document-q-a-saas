import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') return null

  if (state.status !== 'authenticated') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <Outlet />
}

