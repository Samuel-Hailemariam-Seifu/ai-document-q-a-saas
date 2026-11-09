import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/auth'
import { AuthShell } from '../components/auth/AuthShell'
import { Icon } from '../components/common/Icon'

function msg(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message?: unknown }).message ?? '')
  return ''
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget as HTMLFormElement)
      const email = String(form.get('email') ?? '')
      await forgotPassword(email)
      setSent(true)
    } catch (e) {
      setError(msg(e) || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We’ll email a reset link if the account exists"
      footer={
        <Link to="/login" className="saas-link">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Icon name="check" size={16} className="mt-0.5 shrink-0" />
          If that email is registered, a reset link has been sent.
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
            <label className="saas-field-label" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Icon
                name="mail"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint"
              />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="saas-input h-10 pl-10"
                placeholder="name@company.com"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="saas-btn saas-btn-primary mt-2 h-10 w-full">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
