import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ThemeToggle } from '../theme/ThemeToggle'

const TITLE_BY_PATH_PREFIX: Array<[prefix: string, title: string]> = [
  ['/app/documents/', 'Document'],
  ['/app/documents', 'Documents'],
  ['/app/chat', 'Chat'],
  ['/app/empty', 'Empty States'],
  ['/app', 'Dashboard'],
]

function titleForPath(pathname: string): string {
  for (const [prefix, title] of TITLE_BY_PATH_PREFIX) {
    if (pathname.startsWith(prefix)) return title
  }
  return 'DocuMind AI'
}

export function AppHeader() {
  const location = useLocation()
  const title = useMemo(() => titleForPath(location.pathname), [location.pathname])
  const { state: authState, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const initials = useMemo(() => {
    if (authState.status !== 'authenticated') return 'U'
    const name = (authState.user.full_name || authState.user.email || 'User').trim()
    const parts = name.split(/\s+/).slice(0, 2)
    const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean)
    return (chars.join('') || 'U').slice(0, 2)
  }, [authState])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const el = menuRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/70 px-4 backdrop-blur-md dark:border-primary/20 dark:bg-background-dark/60 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white md:text-base">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <ThemeToggle />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white pl-2 pr-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-primary/20 dark:bg-primary/5 dark:text-slate-200 dark:hover:bg-primary/10"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open profile menu"
            aria-expanded={open}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">
              {initials}
            </div>
            <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
          </button>

          {open ? (
            <div className="absolute right-0 top-11 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-primary/20 dark:bg-background-dark">
              <div className="px-4 py-3">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {authState.status === 'authenticated' ? authState.user.full_name || 'Account' : 'Account'}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {authState.status === 'authenticated' ? authState.user.email : ''}
                </p>
              </div>
              <div className="h-px bg-slate-200 dark:bg-primary/20" />
              <div className="p-2">
                <Link
                  to="/app/settings"
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-primary/10"
                  onClick={() => setOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                  Profile
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-primary/10"
                  onClick={() => {
                    setOpen(false)
                    logout()
                  }}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">logout</span>
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

