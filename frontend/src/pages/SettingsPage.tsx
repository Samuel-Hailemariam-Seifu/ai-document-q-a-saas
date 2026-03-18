import { useMemo } from 'react'
import { useAuth } from '../auth/AuthContext'

export function SettingsPage() {
  const { state, logout } = useAuth()

  const email = state.status === 'authenticated' ? state.user.email : ''
  const name = state.status === 'authenticated' ? state.user.full_name : 'Account'

  const initials = useMemo(() => {
    const base = (name || email || 'User').trim()
    const parts = base.split(/\s+/).slice(0, 2)
    const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean)
    return (chars.join('') || 'U').slice(0, 2)
  }, [name, email])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="saas-title">Settings</h1>
        <p className="saas-subtitle">Manage your account preferences.</p>
      </div>

      <div className="saas-gradient-panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Account</p>
            <p className="mt-1 text-lg font-bold">Security and profile controls</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-white/90">manage_accounts</span>
        </div>
      </div>

      <div className="saas-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-base font-extrabold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{name || 'Account'}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{email}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/5"
            onClick={() => logout()}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

