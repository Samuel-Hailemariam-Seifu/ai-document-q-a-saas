import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { PRODUCT_NAME } from '../../lib/brand'
import { Icon } from '../common/Icon'
import { useDismiss } from '../common/useDismiss'
import { LogoMark } from '../brand/LogoMark'
import { ThemeToggle } from '../theme/ThemeToggle'

type Crumb = { label: string; to?: string }

function crumbsForPath(pathname: string): Crumb[] {
  if (pathname.startsWith('/app/documents/')) {
    return [{ label: 'Documents', to: '/app/documents' }, { label: 'Details' }]
  }
  if (pathname.startsWith('/app/documents')) return [{ label: 'Documents' }]
  if (pathname.startsWith('/app/chat')) return [{ label: 'Assistant' }]
  if (pathname.startsWith('/app/billing')) return [{ label: 'Billing' }]
  if (pathname.startsWith('/app/settings')) return [{ label: 'Settings' }]
  if (pathname.startsWith('/app')) return [{ label: 'Overview' }]
  return [{ label: PRODUCT_NAME }]
}

function initialsFor(name: string | null | undefined, email: string | null | undefined): string {
  const base = (name || email || 'User').trim()
  const chars = base
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
  return (chars.join('') || 'U').slice(0, 2)
}

export function AppHeader({
  onOpenNav,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  onOpenNav?: () => void
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}) {
  const location = useLocation()
  const crumbs = useMemo(() => crumbsForPath(location.pathname), [location.pathname])
  const { state: authState, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])
  const menuRef = useDismiss(open, close)

  const user = authState.status === 'authenticated' ? authState.user : null
  const initials = useMemo(() => initialsFor(user?.full_name, user?.email), [user])

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-subtle px-3 sm:px-4 md:px-6">
      <button
        type="button"
        className="saas-icon-btn -ml-1 md:hidden"
        aria-label="Open navigation"
        onClick={onOpenNav}
      >
        <Icon name="menu" size={18} />
      </button>

      {onToggleSidebar ? (
        <button
          type="button"
          className="saas-icon-btn -ml-1 hidden md:inline-flex"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
        >
          <Icon name="panelLeft" size={18} />
        </button>
      ) : null}

      <Link to="/app" className="shrink-0 md:hidden" aria-label={`${PRODUCT_NAME} home`}>
        <LogoMark size={24} />
      </Link>

      <nav aria-label="Breadcrumb" className="ml-1 flex min-w-0 items-center gap-1.5 text-sm md:ml-0">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <span key={c.label} className="flex min-w-0 items-center gap-1.5">
              {i > 0 ? <span className="text-content-faint">/</span> : null}
              {c.to && !last ? (
                <Link to={c.to} className="truncate text-content-muted transition-colors hover:text-content">
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-content" aria-current={last ? 'page' : undefined}>
                  {c.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {!location.pathname.startsWith('/app/chat') ? (
          <Link to="/app/chat" className="saas-btn saas-btn-secondary saas-btn-sm mr-1 hidden sm:inline-flex">
            <Icon name="sparkles" size={14} className="text-accent-text" />
            Ask assistant
          </Link>
        ) : null}

        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-surface-hover"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Open account menu"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-700 text-[11px] font-semibold text-white ring-2 ring-[var(--surface-solid)]">
              {initials}
            </span>
          </button>

          {open ? (
            <div className="saas-menu absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl" role="menu">
              <div className="flex items-center gap-3 px-3 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-700 text-xs font-semibold text-white">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-content">{user?.full_name || 'Account'}</p>
                  <p className="saas-meta truncate">{user?.email ?? ''}</p>
                </div>
              </div>
              <div className="saas-divider" />
              <div className="p-1">
                <Link to="/app/settings" role="menuitem" className="saas-menu-item" onClick={close}>
                  <Icon name="user" size={15} className="text-content-muted" />
                  Account settings
                </Link>
                <Link to="/app/billing" role="menuitem" className="saas-menu-item" onClick={close}>
                  <Icon name="billing" size={15} className="text-content-muted" />
                  Billing
                </Link>
              </div>
              <div className="saas-divider" />
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  className="saas-menu-item"
                  onClick={() => {
                    close()
                    logout()
                  }}
                >
                  <Icon name="logout" size={15} className="text-content-muted" />
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
