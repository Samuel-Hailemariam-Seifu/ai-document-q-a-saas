import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { listRecentChats, type ChatPreview } from '../../services/chat'
import { useWorkspaces } from '../../workspaces/WorkspaceContext'
import { LogoMark } from '../brand/LogoMark'

function panelNavClass({ isActive }: { isActive: boolean }) {
  return [
    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-primary text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-primary/10 dark:hover:text-white',
  ].join(' ')
}

function railNavClass({ isActive }: { isActive: boolean }) {
  return [
    'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
    isActive
      ? 'bg-white/25 text-white shadow-sm'
      : 'text-white/85 hover:bg-white/15 hover:text-white',
  ].join(' ')
}

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

export function AppSidebar() {
  const { state, setActiveWorkspaceId, create } = useWorkspaces()
  const { state: authState, logout } = useAuth()
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed())
  const [recentOpen, setRecentOpen] = useState(true)
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([])
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null)

  const workspaceId = state.status === 'ready' ? state.activeWorkspaceId : null

  const initials = useMemo(() => {
    if (authState.status !== 'authenticated') return 'U'
    const base = (authState.user.full_name || authState.user.email || 'User').trim()
    const parts = base.split(/\s+/).slice(0, 2)
    const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean)
    return (chars.join('') || 'U').slice(0, 2)
  }, [authState])

  const refreshRecent = useCallback(async () => {
    if (!workspaceId) {
      setRecentChats([])
      return
    }
    try {
      const list = await listRecentChats(workspaceId, 6)
      setRecentChats(list)
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
    if (!workspaceOpen) return
    const onDown = (e: MouseEvent) => {
      const el = workspaceMenuRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setWorkspaceOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWorkspaceOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [workspaceOpen])

  const activeWorkspaceName = useMemo(() => {
    if (state.status !== 'ready') return 'Workspace'
    const active = state.items.find((w) => w.id === state.activeWorkspaceId)
    return active?.name ?? 'Workspace'
  }, [state])

  return (
    <aside
      className={[
        'hidden shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur dark:border-primary/20 dark:bg-background-dark/60 md:flex overflow-hidden transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[92px]' : 'w-[320px]',
      ].join(' ')}
    >
      {workspaceModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Create workspace"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setWorkspaceModalOpen(false)
          }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-primary/20 dark:bg-background-dark">
            <div className="px-5 py-4">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Create workspace</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Workspaces keep documents and chats isolated.
              </p>
            </div>
            <div className="px-5 pb-5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Workspace name</label>
              <input
                autoFocus
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g., HR Policies"
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-100"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setWorkspaceModalOpen(false)
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const name = workspaceName.trim()
                    if (!name || creatingWorkspace) return
                    setCreatingWorkspace(true)
                    void create(name)
                      .then(() => {
                        setWorkspaceModalOpen(false)
                        setWorkspaceName('')
                      })
                      .finally(() => setCreatingWorkspace(false))
                  }
                }}
              />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/5"
                  onClick={() => setWorkspaceModalOpen(false)}
                  disabled={creatingWorkspace}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                  disabled={creatingWorkspace || workspaceName.trim().length < 2}
                  onClick={() => {
                    const name = workspaceName.trim()
                    if (!name) return
                    setCreatingWorkspace(true)
                    void create(name)
                      .then(() => {
                        setWorkspaceModalOpen(false)
                        setWorkspaceName('')
                      })
                      .finally(() => setCreatingWorkspace(false))
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {creatingWorkspace ? 'hourglass_top' : 'add'}
                  </span>
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex h-full min-h-0 p-3">
        {/* Left icon rail */}
        {collapsed ? (
          <div className="flex w-14 shrink-0 flex-col rounded-3xl bg-gradient-to-b from-indigo-500 to-violet-600 p-2 text-white shadow-lg shadow-indigo-500/20">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <LogoMark size={22} className="shrink-0" />
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25"
                aria-label="Expand sidebar"
                onClick={() => {
                  setCollapsed(false)
                  writeCollapsed(false)
                }}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            <nav className="mt-4 flex flex-1 flex-col items-center gap-2">
              {[
                { to: '/app', label: 'Dashboard', icon: 'home', end: true },
                { to: '/app/documents', label: 'Documents', icon: 'description' },
                { to: '/app/chat', label: 'Chat', icon: 'chat_bubble' },
                { to: '/app/billing', label: 'Billing', icon: 'paid' },
                { to: '/app/settings', label: 'Settings', icon: 'settings' },
              ].map((it) => (
                <NavLink
                  key={it.to}
                  className={railNavClass}
                  to={it.to}
                  end={it.end as true | undefined}
                  title={it.label}
                >
                  <span className="material-symbols-outlined text-[18px]">{it.icon}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50"
                title="New analysis"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25"
                onClick={() => logout()}
                aria-label="Logout"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          </div>
        ) : null}
        {/* Right content panel (expanded) */}
        {!collapsed ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out dark:border-primary/20 dark:bg-background-dark">
            <div className="border-b border-slate-200 px-3 py-3 dark:border-primary/20">
              {state.status === 'ready' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-primary/20 dark:bg-primary/5 dark:text-slate-200 dark:hover:bg-primary/10"
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar"
                    onClick={() => {
                      setCollapsed(true)
                      writeCollapsed(true)
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <div className="relative w-full" ref={workspaceMenuRef}>
                    <button
                      type="button"
                      className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] font-semibold text-slate-800 transition-colors hover:bg-white dark:border-primary/20 dark:bg-primary/10 dark:text-slate-100 dark:hover:bg-primary/20"
                      onClick={() => setWorkspaceOpen((v) => !v)}
                      aria-expanded={workspaceOpen}
                      aria-label="Select workspace"
                    >
                      <span className="truncate pr-2">{activeWorkspaceName}</span>
                      <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                    </button>

                    {workspaceOpen ? (
                      <div className="absolute right-0 top-11 z-30 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-primary/20 dark:bg-background-dark">
                        <div className="max-h-64 overflow-y-auto p-2">
                          {state.items.map((w) => {
                            const active = w.id === state.activeWorkspaceId
                            return (
                              <button
                                key={w.id}
                                type="button"
                                className={[
                                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors',
                                  active
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-primary/10',
                                ].join(' ')}
                                onClick={() => {
                                  setActiveWorkspaceId(w.id)
                                  setWorkspaceOpen(false)
                                }}
                              >
                                <span className="truncate">{w.name}</span>
                                {active ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-primary/20 dark:bg-primary/5 dark:text-slate-200 dark:hover:bg-primary/10"
                    aria-label="Add workspace"
                    title="Add workspace"
                    onClick={() => {
                      setWorkspaceOpen(false)
                      setWorkspaceName('')
                      setWorkspaceModalOpen(true)
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              ) : (
                <div className="h-9 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-primary/10" />
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <nav className="space-y-1">
                {[
                  { to: '/app', label: 'Dashboard', icon: 'home', end: true },
                  { to: '/app/documents', label: 'Documents', icon: 'description' },
                  { to: '/app/chat', label: 'Chat', icon: 'chat_bubble' },
                  { to: '/app/billing', label: 'Billing', icon: 'paid' },
                  { to: '/app/settings', label: 'Settings', icon: 'settings' },
                ].map((it) => (
                  <NavLink key={it.to} className={panelNavClass} to={it.to} end={it.end as true | undefined}>
                    <span className="material-symbols-outlined text-[18px]">{it.icon}</span>
                    <span>{it.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="mt-5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-primary/10"
                  onClick={() => setRecentOpen((v) => !v)}
                  aria-label="Toggle recent chats"
                >
                  <span>Recent chats</span>
                  <span className="material-symbols-outlined text-[18px]">{recentOpen ? 'expand_less' : 'expand_more'}</span>
                </button>

                {recentOpen ? (
                  <div className="mt-2 space-y-1">
                    {recentChats.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-slate-500 dark:text-slate-400">No recent chats.</div>
                    ) : (
                      recentChats.map((c) => (
                        <Link
                          key={c.id}
                          to={`/app/chat?chatId=${c.id}`}
                          className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-primary/10"
                          title={c.title}
                          onClick={() => void refreshRecent()}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">chat_bubble</span>
                            <span className="truncate">{c.title}</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-slate-200 px-3 py-3 dark:border-primary/20">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-primary/10">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Get more power</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Upgrade for higher limits and faster processing.
                </p>
                <Link
                  to="/app/billing"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                  Go to billing
                </Link>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-primary/20 dark:bg-primary/5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-extrabold text-primary">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {authState.status === 'authenticated' ? authState.user.full_name || 'Account' : 'Account'}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {authState.status === 'authenticated' ? authState.user.email : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

