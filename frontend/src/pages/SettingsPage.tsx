import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { changePassword, updateProfile } from '../services/auth'
import { Icon } from '../components/common/Icon'
import { PageHeader } from '../components/layout/PageHeader'

type FormMessage = { type: 'success' | 'error'; text: string }

function Feedback({ message }: { message: FormMessage | null }) {
  if (!message) return null
  return (
    <div
      className={[
        'mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
        message.type === 'success'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
      ].join(' ')}
    >
      <Icon name={message.type === 'success' ? 'check' : 'alert'} size={16} className="mt-0.5 shrink-0" />
      <span>{message.text}</span>
    </div>
  )
}

export function SettingsPage() {
  const { state, logout, refreshMe } = useAuth()

  const email = state.status === 'authenticated' ? state.user.email : ''
  const name = state.status === 'authenticated' ? state.user.full_name : 'Account'

  const [profileName, setProfileName] = useState(name)
  const [profileEmail, setProfileEmail] = useState(email)
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileMessage, setProfileMessage] = useState<FormMessage | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<FormMessage | null>(null)

  const initials = useMemo(() => {
    const base = (name || email || 'User').trim()
    const chars = base
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .filter(Boolean)
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
      <PageHeader
        title="Settings"
        description="Manage your profile and account security."
        actions={
          <button type="button" className="saas-btn saas-btn-secondary" onClick={() => logout()}>
            <Icon name="logout" size={16} />
            Log out
          </button>
        }
      />

      <div className="saas-card flex items-center gap-4 p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary dark:text-primary-dark">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{name || 'Account'}</p>
          <p className="saas-meta truncate">{email}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="saas-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Icon name="user" size={16} className="text-slate-400" />
            <h2 className="saas-section-title">Profile</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="settings-name" className="saas-label">
                Full name
              </label>
              <input
                id="settings-name"
                className="saas-input mt-2"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="settings-email" className="saas-label">
                Email
              </label>
              <input
                id="settings-email"
                type="email"
                className="saas-input mt-2"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
          </div>

          <Feedback message={profileMessage} />

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              className="saas-btn saas-btn-primary w-full sm:w-auto"
              onClick={() => void saveProfile()}
              disabled={profileBusy || profileName.trim().length < 2 || profileEmail.trim().length < 3}
            >
              {profileBusy ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </section>

        <section className="saas-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Icon name="lock" size={16} className="text-slate-400" />
            <h2 className="saas-section-title">Password</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="settings-current-password" className="saas-label">
                Current password
              </label>
              <input
                id="settings-current-password"
                type="password"
                className="saas-input mt-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="settings-new-password" className="saas-label">
                New password
              </label>
              <input
                id="settings-new-password"
                type="password"
                className="saas-input mt-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <Feedback message={passwordMessage} />

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              className="saas-btn saas-btn-primary w-full sm:w-auto"
              onClick={() => void submitPassword()}
              disabled={passwordBusy || newPassword.length < 8 || currentPassword.length < 1}
            >
              {passwordBusy ? 'Updating…' : 'Change password'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
