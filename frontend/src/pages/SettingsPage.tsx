import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { changePassword, updateProfile } from '../services/auth'
import { DisabledHint } from '../components/common/DisabledHint'
import { Icon } from '../components/common/Icon'
import { PageHeader } from '../components/layout/PageHeader'
import { ThemeToggle } from '../components/theme/ThemeToggle'
import { PRODUCT_NAME } from '../lib/brand'

type FormMessage = { type: 'success' | 'error'; text: string }

function Feedback({ message }: { message: FormMessage | null }) {
  if (!message) return null
  return (
    <div
      className={[
        'mt-1 flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
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
  const user = state.status === 'authenticated' ? state.user : null

  const [profileName, setProfileName] = useState(name)
  const [profileEmail, setProfileEmail] = useState(email)
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileMessage, setProfileMessage] = useState<FormMessage | null>(null)

  useEffect(() => {
    setProfileName(name)
    setProfileEmail(email)
  }, [name, email])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<FormMessage | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteMessage, setDeleteMessage] = useState<FormMessage | null>(null)

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

  const exportData = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      product: PRODUCT_NAME,
      profile: user
        ? { id: user.id, email: user.email, full_name: user.full_name }
        : null,
      note: 'Workspace documents and chats require a dedicated export API for a full archive.',
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'documind-profile-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const requestDeleteAccount = () => {
    if (deleteConfirm.trim() !== 'DELETE') {
      setDeleteMessage({ type: 'error', text: 'Type DELETE to confirm.' })
      return
    }
    // Account deletion API not available yet — clear local session and explain.
    setDeleteMessage({
      type: 'error',
      text: 'Account deletion is not enabled on the server yet. You have been signed out locally.',
    })
    window.setTimeout(() => logout(), 1200)
  }

  const profileInvalid = profileName.trim().length < 2 || profileEmail.trim().length < 3
  const passwordInvalid = newPassword.length < 8 || currentPassword.length < 1

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your profile, security and account preferences." />

      <div className="divide-y divide-[var(--border-subtle)] border-t border-subtle">
        {/* Profile */}
        <SettingsSection title="Profile" description="How you appear to teammates in shared workspaces.">
          <div className="saas-card overflow-hidden">
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-700 text-base font-semibold text-white shadow-raised">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-content">{profileName || 'Your name'}</p>
                  <p className="saas-meta truncate">{email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-name" className="saas-field-label">
                    Full name
                  </label>
                  <input
                    id="settings-name"
                    className="saas-input"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="settings-email" className="saas-field-label">
                    Email address
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    className="saas-input"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <Feedback message={profileMessage} />
            </div>
            <SectionFooter hint="Your email is used to sign in.">
              <DisabledHint
                disabled={profileBusy || profileInvalid}
                reason={profileBusy ? 'Saving profile…' : 'Enter a name (2+ characters) and a valid email to save.'}
              >
                <button
                  type="button"
                  className="saas-btn saas-btn-primary saas-btn-sm"
                  onClick={() => void saveProfile()}
                  disabled={profileBusy || profileInvalid}
                >
                  {profileBusy ? 'Saving…' : 'Save changes'}
                </button>
              </DisabledHint>
            </SectionFooter>
          </div>
        </SettingsSection>

        {/* Password */}
        <SettingsSection title="Password" description="Use at least 8 characters. You’ll stay signed in on this device.">
          <div className="saas-card overflow-hidden">
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label htmlFor="settings-current-password" className="saas-field-label">
                  Current password
                </label>
                <input
                  id="settings-current-password"
                  type="password"
                  className="saas-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label htmlFor="settings-new-password" className="saas-field-label">
                  New password
                </label>
                <input
                  id="settings-new-password"
                  type="password"
                  className="saas-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="sm:col-span-2">
                <Feedback message={passwordMessage} />
              </div>
            </div>
            <SectionFooter hint="Forgot it? Sign out and use “Forgot password”.">
              <DisabledHint
                disabled={passwordBusy || passwordInvalid}
                reason="Enter your current password and a new password with at least 8 characters."
              >
                <button
                  type="button"
                  className="saas-btn saas-btn-primary saas-btn-sm"
                  onClick={() => void submitPassword()}
                  disabled={passwordBusy || passwordInvalid}
                >
                  {passwordBusy ? 'Updating…' : 'Update password'}
                </button>
              </DisabledHint>
            </SectionFooter>
          </div>
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences" description="Personalise how the app looks on this device.">
          <div className="saas-card divide-y divide-[var(--border-subtle)]">
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-content">Theme</p>
                <p className="saas-meta mt-0.5">Toggle between light and dark mode.</p>
              </div>
              <div className="rounded-lg border border-subtle">
                <ThemeToggle />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-content">Export my data</p>
                <p className="saas-meta mt-0.5">Download your profile as a JSON file.</p>
              </div>
              <button type="button" className="saas-btn saas-btn-secondary saas-btn-sm" onClick={exportData}>
                <Icon name="file" size={14} />
                Export
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-content">Sign out</p>
                <p className="saas-meta mt-0.5">End your session on this device.</p>
              </div>
              <button type="button" className="saas-btn saas-btn-secondary saas-btn-sm" onClick={() => logout()}>
                <Icon name="logout" size={14} />
                Log out
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger zone" description="Irreversible actions for your account.">
          <div className="overflow-hidden rounded-xl border border-rose-200 bg-surface-solid shadow-soft dark:border-rose-500/30">
            <div className="p-5 sm:p-6">
              <p className="text-sm font-medium text-content">Delete account</p>
              <p className="saas-meta mt-1">
                Permanently remove your account and all associated data. Type{' '}
                <span className="font-mono font-semibold text-content">DELETE</span> to confirm.
              </p>
              <input
                className="saas-input mt-4 sm:max-w-xs"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                aria-label="Confirm account deletion"
              />
              <Feedback message={deleteMessage} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-rose-200 bg-rose-50/60 px-5 py-3 dark:border-rose-500/30 dark:bg-rose-500/5 sm:px-6">
              <p className="text-xs text-rose-700 dark:text-rose-300">This cannot be undone.</p>
              <button
                type="button"
                className="saas-btn saas-btn-danger saas-btn-sm"
                disabled={deleteConfirm.trim() !== 'DELETE'}
                onClick={requestDeleteAccount}
              >
                Delete account
              </button>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-4 py-8 md:grid-cols-3 md:gap-8">
      <div>
        <h2 className="saas-section-title">{title}</h2>
        <p className="saas-meta mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
  )
}

function SectionFooter({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-subtle bg-surface-muted/60 px-5 py-3 sm:px-6">
      <p className="text-xs text-content-muted">{hint}</p>
      {children}
    </div>
  )
}
