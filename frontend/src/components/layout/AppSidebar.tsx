import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { listRecentChats, type ChatPreview } from '../../services/chat'
import { useWorkspaces } from '../../workspaces/WorkspaceContext'
import { Icon, type IconName } from '../common/Icon'
import { LogoMark } from '../brand/LogoMark'

const COLLAPSED_KEY = 'documind.sidebarCollapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(v: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0')
  } catch {
    // ignore
  }
}

type NavItem = { to: string; label: string; icon: IconName; end?: true }

const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/app/documents', label: 'Documents', icon: 'folder' },
  { to: '/app/chat', label: 'Assistant', icon: 'sparkles' },
  { to: '/app/billing', label: 'Billing', icon: 'billing' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
]

const ICON_BUTTON =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'

function navItemClass(compact: boolean) {
  return ({ isActive }: { isActive: boolean }) =>
    [
      'flex h-10 items-center gap-3 rounded-lg text-sm transition-colors',
      compact ? 'w-10 justify-center' : 'px-3',
      isActive
        ? 'bg-primary/10 font-semibold text-primary dark:text-primary-dark'
        : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white',
    ].join(' ')
}

export function AppSidebar({
  mobile,
  onRequestClose,
}: {
  mobile?: boolean
  onRequestClose?: () => void
}) {
  const { state } = useWorkspaces()
  const [collapsed, setCollapsed] = useState<boolean>(() => (mobile ? false : readCollapsed()))
  const [recentOpen, setRecentOpen] = useState(true)
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([])

  // Collapsed is a desktop-only affordance; the mobile drawer always shows labels.
  const compact = !mobile && collapsed
  const workspaceId = state.status === 'ready' ? state.activeWorkspaceId : null

  const refreshRecent = useCallback(async () => {
    if (!workspaceId) {
      setRecentChats([])
      return
    }
    try {
      setRecentChats(await listRecentChats(workspaceId, 6))
    } catch {
      setRecentChats([])
    }
  }, [workspaceId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshRecent()
    }, 0)
    return () => window.clearTimeout(t)
  }, [refreshRecent])

  useEffect(() => {
    if (!mobile) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onRequestClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobile, onRequestClose])

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      writeCollapsed(!v)
      return !v
    })
  }

  return (
    <aside
      className={[
        'flex flex-col bg-white dark:bg-surface-dark',
        mobile
          ? 'fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-xl'
          : 'hidden shrink-0 border-r border-slate-200 transition-[width] duration-200 ease-out dark:border-slate-800 md:flex',
        mobile ? '' : compact ? 'w-[76px]' : 'w-[272px]',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 dark:border-slate-800',
          compact ? 'justify-center px-2' : 'px-4',
        ].join(' ')}
      >
        <Link
          to="/app"
          onClick={() => onRequestClose?.()}
          className="flex min-w-0 items-center gap-2.5"
          aria-label="DocuMind AI home"
        >
          <LogoMark size={26} className="shrink-0" />
          {!compact ? (
            <span className="truncate font-heading text-[15px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
              DocuMind AI
            </span>
          ) : null}
        </Link>

        {mobile ? (
          <button type="button" className={`${ICON_BUTTON} ml-auto`} aria-label="Close navigation" onClick={onRequestClose}>
            <Icon name="close" size={18} />
          </button>
        ) : null}

        {!mobile && !compact ? (
          <button
            type="button"
            className={`${ICON_BUTTON} ml-auto`}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            onClick={toggleCollapsed}
          >
            <Icon name="panelClose" size={18} />
          </button>
        ) : null}
      </div>

      <div className={['custom-scrollbar min-h-0 flex-1 overflow-y-auto py-4', compact ? 'px-3' : 'px-3'].join(' ')}>
        {compact ? (
          <div className="mb-2 flex justify-center">
            <button
              type="button"
              className={ICON_BUTTON}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={toggleCollapsed}
            >
              <Icon name="panelOpen" size={18} />
            </button>
          </div>
        ) : (
          <p className="saas-label px-3 pb-2">Menu</p>
        )}

        <nav className={['flex flex-col gap-1', compact ? 'items-center' : ''].join(' ')}>
          {NAV_ITEMS.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={navItemClass(compact)}
              title={compact ? it.label : undefined}
              onClick={() => onRequestClose?.()}
            >
              <Icon name={it.icon} size={18} className="shrink-0" />
              {!compact ? <span className="truncate">{it.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        {!compact ? (
          <div className="mt-6">
            <button
              type="button"
              className="saas-label flex w-full items-center justify-between rounded-lg px-3 py-1.5 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
              onClick={() => setRecentOpen((v) => !v)}
              aria-expanded={recentOpen}
            >
              <span className="flex items-center gap-1.5">
                <Icon name="history" size={14} />
                Recent chats
              </span>
              <Icon
                name="chevronDown"
                size={14}
                className={recentOpen ? 'transition-transform' : '-rotate-90 transition-transform'}
              />
            </button>

            {recentOpen ? (
              <div className="mt-1 flex flex-col gap-0.5">
                {recentChats.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">No recent chats yet.</p>
                ) : (
                  recentChats.map((c) => (
                    <Link
                      key={c.id}
                      to={`/app/chat?chatId=${c.id}`}
                      title={c.title}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                      onClick={() => {
                        void refreshRecent()
                        onRequestClose?.()
                      }}
                    >
                      <Icon name="chat" size={16} className="shrink-0 text-slate-400" />
                      <span className="truncate">{c.title}</span>
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className={[
          'shrink-0 border-t border-slate-200 dark:border-slate-800',
          compact ? 'flex justify-center px-2 py-3' : 'px-3 py-3',
        ].join(' ')}
      >
        {compact ? (
          <Link
            to="/app/billing"
            className={ICON_BUTTON}
            aria-label="Upgrade plan"
            title="Upgrade plan"
            onClick={() => onRequestClose?.()}
          >
            <Icon name="crown" size={18} />
          </Link>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <Icon name="crown" size={15} className="shrink-0 text-primary dark:text-primary-dark" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">Upgrade plan</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Higher limits and faster processing.
            </p>
            <Link
              to="/app/billing"
              className="mt-3 flex h-8 items-center justify-center rounded-lg bg-primary text-xs font-medium text-white transition-colors hover:bg-primary/90"
              onClick={() => onRequestClose?.()}
            >
              View plans
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
