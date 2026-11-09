import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/auth'
import { AuthShell } from '../components/auth/AuthShell'
import { Icon } from '../components/common/Icon'

function msg(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message?: unknown }).message ?? '')
  return ''
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const hasToken = useMemo(() => token.length >= 10, [token])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget as HTMLFormElement)
      const password = String(form.get('password') ?? '')
      await resetPassword(token, password)
      setDone(true)
    } catch (e) {
      setError(msg(e) || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your account"
      footer={
        <Link to="/login" className="saas-link">
          Back to login
        </Link>
      }
    >
      {!hasToken ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          Missing or invalid reset token.
        </div>
      ) : done ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Icon name="check" size={16} className="mt-0.5 shrink-0" />
          Password updated. You can now log in.
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}
          <div>
            <label className="saas-field-label" htmlFor="password">
              New password
            </label>
            <div className="relative">
              <Icon
                name="lock"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint"
              />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                className="saas-input h-10 pl-10 pr-11"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="saas-icon-btn absolute right-1 top-1/2 size-8 -translate-y-1/2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="saas-btn saas-btn-primary mt-2 h-10 w-full">
            {loading ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
