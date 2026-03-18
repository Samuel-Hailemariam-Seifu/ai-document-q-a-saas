import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { changePassword, updateProfile } from '../services/auth'

export function SettingsPage() {
  const { state, logout, refreshMe } = useAuth()

  const email = state.status === 'authenticated' ? state.user.email : ''
  const name = state.status === 'authenticated' ? state.user.full_name : 'Account'

  const [profileName, setProfileName] = useState(name)
  const [profileEmail, setProfileEmail] = useState(email)
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const initials = useMemo(() => {
    const base = (name || email || 'User').trim()
    const parts = base.split(/\s+/).slice(0, 2)
    const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean)
    return (chars.join('') || 'U').slice(0, 2)
  }, [name, email])

  const saveProfile = useCallback(async () => {
    if (state.status !== 'authenticated') return
    setProfileBusy(true)
    setProfileMessage(null)
    try {
      await updateProfile({ full_name: profileName.trim(), email: profileEmail.trim() })
      await refreshMe()
      setProfileMessage({ type: 'success', text: 'Profile updated.' })
    } catch (e) {
      setProfileMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to update profile' })
    } finally {
      setProfileBusy(false)
      window.setTimeout(() => setProfileMessage(null), 5000)
    }
  }, [profileEmail, profileName, refreshMe, state.status])

  const submitPassword = useCallback(async () => {
    if (state.status !== 'authenticated') return
    setPasswordBusy(true)
    setPasswordMessage(null)
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage({ type: 'success', text: 'Password changed.' })
    } catch (e) {
      setPasswordMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to change password' })
    } finally {
      setPasswordBusy(false)
      window.setTimeout(() => setPasswordMessage(null), 5000)
    }
  }, [currentPassword, newPassword, state.status])

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

      <div className="saas-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-base font-extrabold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{name || 'Account'}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-primary/20 dark:bg-background-dark">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Profile</p>
            {profileMessage ? (
              <div
                className={[
                  'mt-3 rounded-xl px-4 py-2 text-sm',
                  profileMessage.type === 'success'
                    ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200',
                ].join(' ')}
              >
                {profileMessage.text}
              </div>
            ) : null}
            <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-slate-500">Full name</label>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-100"
              placeholder="Your name"
            />
            <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-slate-500">Email</label>
            <input
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-100"
              placeholder="you@company.com"
            />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                onClick={() => void saveProfile()}
                disabled={profileBusy || profileName.trim().length < 2 || profileEmail.trim().length < 3}
              >
                {profileBusy ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-primary/20 dark:bg-background-dark">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</p>
            {passwordMessage ? (
              <div
                className={[
                  'mt-3 rounded-xl px-4 py-2 text-sm',
                  passwordMessage.type === 'success'
                    ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200',
                ].join(' ')}
              >
                {passwordMessage.text}
              </div>
            ) : null}
            <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Current password
            </label>
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-100"
              placeholder="••••••••"
            />
            <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-slate-500">New password</label>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-100"
              placeholder="At least 8 characters"
            />
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/5 sm:w-auto"
                onClick={() => logout()}
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
              <button
                type="button"
                className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                onClick={() => void submitPassword()}
                disabled={passwordBusy || newPassword.length < 8 || currentPassword.length < 1}
              >
                {passwordBusy ? 'Updating…' : 'Change password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

