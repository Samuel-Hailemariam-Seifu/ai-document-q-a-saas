import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Icon } from '../common/Icon'
import { useDismiss } from '../common/useDismiss'
import { LogoMark } from '../brand/LogoMark'
import { ThemeToggle } from '../theme/ThemeToggle'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

const TITLE_BY_PATH_PREFIX: Array<[prefix: string, title: string]> = [
  ['/app/documents/', 'Document'],
  ['/app/documents', 'Documents'],
  ['/app/chat', 'Assistant'],
  ['/app/billing', 'Billing'],
  ['/app/settings', 'Settings'],
  ['/app/empty', 'Empty States'],
  ['/app', 'Dashboard'],
]

function titleForPath(pathname: string): string {
  for (const [prefix, title] of TITLE_BY_PATH_PREFIX) {
    if (pathname.startsWith(prefix)) return title
  }
  return 'DocuMind AI'
}

export function AppHeader({ onOpenNav }: { onOpenNav?: () => void }) {
  const location = useLocation()
  const title = useMemo(() => titleForPath(location.pathname), [location.pathname])
  const { state: authState, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])
  const menuRef = useDismiss(open, close)

  const user = authState.status === 'authenticated' ? authState.user : null

  const initials = useMemo(() => {
    const base = (user?.full_name || user?.email || 'User').trim()
    const chars = base
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .filter(Boolean)
    return (chars.join('') || 'U').slice(0, 2)
  }, [user])

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-surface-dark md:px-6">
      <button
        type="button"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 md:hidden"
        aria-label="Open navigation"
        onClick={onOpenNav}
      >
        <Icon name="menu" size={20} />
      </button>

      <Link to="/app" className="shrink-0 md:hidden" aria-label="DocuMind AI home">
        <LogoMark size={26} />
      </Link>

      <div className="flex min-w-0 items-center gap-2">
        <WorkspaceSwitcher />
        <Icon name="chevronRight" size={15} className="hidden shrink-0 text-slate-300 dark:text-slate-600 sm:block" />
        <h1 className="hidden truncate text-sm font-medium text-slate-900 dark:text-white sm:block">{title}</h1>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Open account menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:text-primary-dark">
              {initials}
            </span>
            <Icon name="chevronDown" size={16} className="text-slate-400" />
          </button>

          {open ? (
            <div
              className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-surface-dark"
              role="menu"
            >
              <div className="px-3 py-3">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {user?.full_name || 'Account'}
                </p>
                <p className="saas-meta mt-0.5 truncate">{user?.email ?? ''}</p>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <div className="p-1.5">
                <Link
                  to="/app/settings"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  onClick={close}
                >
                  <Icon name="settings" size={16} className="text-slate-400" />
                  Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  onClick={() => {
                    close()
                    logout()
                  }}
                >
                  <Icon name="logout" size={16} className="text-slate-400" />
                  Log out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
