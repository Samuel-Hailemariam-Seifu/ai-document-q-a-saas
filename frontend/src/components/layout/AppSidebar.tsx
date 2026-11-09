import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { PRODUCT_NAME } from '../../lib/brand'
import { formatNumber } from '../../lib/format'
import { listRecentChats, type ChatPreview } from '../../services/chat'
import { getUsageSnapshot, type UsageSnapshot } from '../../services/usage'
import { useWorkspaces } from '../../workspaces/WorkspaceContext'
import { Icon, type IconName } from '../common/Icon'
import { LogoMark } from '../brand/LogoMark'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

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

const PRIMARY_NAV: NavItem[] = [
  { to: '/app', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/app/chat', label: 'Assistant', icon: 'sparkles' },
  { to: '/app/documents', label: 'Documents', icon: 'folder' },
]

const ACCOUNT_NAV: NavItem[] = [
  { to: '/app/billing', label: 'Billing', icon: 'billing' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
]

function navItemClass(compact: boolean) {
  return ({ isActive }: { isActive: boolean }) =>
    [
      'saas-nav-item',
      compact ? 'w-9 justify-center px-0' : '',
      isActive ? 'saas-nav-item-active' : '',
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
  const [usage, setUsage] = useState<UsageSnapshot | null>(null)

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

  const refreshUsage = useCallback(async () => {
    if (!workspaceId) {
      setUsage(null)
      return
    }
    try {
      setUsage(await getUsageSnapshot(workspaceId))
    } catch {
      setUsage(null)
    }
  }, [workspaceId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshRecent()
      void refreshUsage()
    }, 0)
    return () => window.clearTimeout(t)
  }, [refreshRecent, refreshUsage])

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

  const renderNav = (items: NavItem[]) => (
    <nav className={['flex flex-col gap-0.5', compact ? 'items-center' : ''].join(' ')}>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={navItemClass(compact)}
          title={compact ? it.label : undefined}
          onClick={() => onRequestClose?.()}
        >
          <Icon name={it.icon} size={16} className="shrink-0 opacity-80" />
          {!compact ? <span className="truncate">{it.label}</span> : null}
        </NavLink>
      ))}
    </nav>
  )

  const isPro = usage?.plan === 'pro'

  return (
    <aside
      className={[
        'flex flex-col',
        mobile
          ? 'fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] animate-pop-in border-r border-subtle bg-surface-canvas shadow-overlay'
          : 'hidden shrink-0 transition-[width] duration-200 ease-out md:flex',
        mobile ? '' : compact ? 'w-[64px]' : 'w-[248px]',
      ].join(' ')}
    >
      {/* Brand + workspace */}
      <div className={['flex shrink-0 flex-col gap-2 pt-3', compact ? 'items-center px-2' : 'px-3'].join(' ')}>
        <div className={['flex h-9 items-center', compact ? 'justify-center' : 'gap-2 px-1'].join(' ')}>
          <Link
            to="/app"
            onClick={() => onRequestClose?.()}
            className="flex min-w-0 items-center gap-2"
            aria-label={`${PRODUCT_NAME} home`}
            title={compact ? PRODUCT_NAME : undefined}
          >
            <LogoMark size={24} className="shrink-0" />
            {!compact ? (
              <span className="truncate text-[0.9375rem] font-semibold tracking-[-0.02em] text-content">
                {PRODUCT_NAME}
              </span>
            ) : null}
          </Link>

          {mobile ? (
            <button
              type="button"
              className="saas-icon-btn ml-auto size-8"
              aria-label="Close navigation"
              onClick={onRequestClose}
            >
              <Icon name="close" size={16} />
            </button>
          ) : null}

          {!mobile && !compact ? (
            <button
              type="button"
              className="saas-icon-btn ml-auto size-8"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              onClick={toggleCollapsed}
            >
              <Icon name="panelClose" size={16} />
            </button>
          ) : null}
        </div>

        <WorkspaceSwitcher compact={compact} />
      </div>

      <div className={['custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-4 pt-4', compact ? 'px-2' : 'px-3'].join(' ')}>
        {compact ? (
          <div className="mb-2 flex justify-center">
            <button
              type="button"
              className="saas-icon-btn size-8"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={toggleCollapsed}
            >
              <Icon name="panelOpen" size={16} />
            </button>
          </div>
        ) : null}

        {renderNav(PRIMARY_NAV)}

        {!compact ? (
          <div className="mt-6">
            <button
              type="button"
              className="group flex h-7 w-full items-center justify-between rounded-md px-2.5 text-xs font-medium text-content-muted transition-colors hover:text-content"
              onClick={() => setRecentOpen((v) => !v)}
              aria-expanded={recentOpen}
            >
              Recent chats
              <Icon
                name="chevronDown"
                size={14}
                className={[
                  'opacity-0 transition group-hover:opacity-100',
                  recentOpen ? '' : '-rotate-90 opacity-100',
                ].join(' ')}
              />
            </button>

            {recentOpen ? (
              <div className="mt-0.5 flex flex-col gap-0.5">
                {recentChats.length === 0 ? (
                  <p className="px-2.5 py-1.5 text-ui-sm text-content-faint">No chats yet</p>
                ) : (
                  recentChats.map((c) => (
                    <Link
                      key={c.id}
                      to={`/app/chat?chatId=${c.id}`}
                      title={c.title}
                      className="saas-nav-item font-normal"
                      onClick={() => {
                        void refreshRecent()
                        onRequestClose?.()
                      }}
                    >
                      <span className="truncate">{c.title}</span>
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={compact ? 'mt-4' : 'mt-6'}>
          {!compact ? <p className="flex h-7 items-center px-2.5 text-xs font-medium text-content-muted">Account</p> : null}
          {renderNav(ACCOUNT_NAV)}
        </div>
      </div>

      {/* Plan + usage */}
      <div className={['shrink-0', compact ? 'flex justify-center px-2 pb-3' : 'px-3 pb-3'].join(' ')}>
        {compact ? (
          <Link
            to="/app/billing"
            className="saas-icon-btn"
            aria-label={isPro ? 'Billing' : 'Upgrade plan'}
            title={
              usage
                ? `${formatNumber(usage.questionsUsed)} / ${formatNumber(usage.questionsLimit)} questions`
                : 'Billing'
            }
            onClick={() => onRequestClose?.()}
          >
            <Icon name="crown" size={16} />
          </Link>
        ) : (
          <div className="rounded-xl border border-subtle bg-surface-solid p-3 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui-sm font-semibold text-content">{isPro ? 'Pro plan' : 'Free plan'}</p>
              {usage?.approximate ? (
                <span className="text-2xs text-content-faint" title="Usage is estimated">
                  ≈
                </span>
              ) : null}
            </div>
            {usage ? (
              <div className="mt-2.5 space-y-2.5">
                <SidebarMeter label="Questions" used={usage.questionsUsed} limit={usage.questionsLimit} />
                <SidebarMeter label="Documents" used={usage.documentsUsed} limit={usage.documentsLimit} />
              </div>
            ) : (
              <div className="mt-2.5 space-y-2">
                <div className="saas-skeleton h-3 w-full" />
                <div className="saas-skeleton h-3 w-2/3" />
              </div>
            )}
            {!isPro ? (
              <Link
                to="/app/billing"
                className="saas-btn saas-btn-primary saas-btn-sm mt-3 w-full"
                onClick={() => onRequestClose?.()}
              >
                <Icon name="sparkles" size={14} />
                Upgrade to Pro
              </Link>
            ) : (
              <Link
                to="/app/billing"
                className="saas-btn saas-btn-secondary saas-btn-sm mt-3 w-full"
                onClick={() => onRequestClose?.()}
              >
                Manage billing
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

function SidebarMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const over = used >= limit
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-content-muted">{label}</span>
        <span className={over ? 'font-medium text-danger' : 'tabular text-content-secondary'}>
          {formatNumber(used)}
          <span className="text-content-faint"> / {formatNumber(limit)}</span>
        </span>
      </div>
      <div className="saas-progress mt-1.5">
        <div
          className={['h-full rounded-full transition-[width]', over ? 'bg-rose-500' : 'bg-[var(--accent)]'].join(' ')}
          style={{ width: `${Math.max(pct, used > 0 ? 3 : 0)}%` }}
        />
      </div>
    </div>
  )
}
