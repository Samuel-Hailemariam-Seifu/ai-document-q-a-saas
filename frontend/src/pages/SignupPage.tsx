import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { register } from '../services/auth'
import { AuthShell } from '../components/auth/AuthShell'
import { Icon } from '../components/common/Icon'

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message?: unknown }).message ?? '')
  return ''
}

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { refreshMe } = useAuth()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const form = new FormData(e.currentTarget as HTMLFormElement)
      const fullName = String(form.get('full_name') ?? '')
      const email = String(form.get('email') ?? '')
      const password = String(form.get('password') ?? '')
      await register({ full_name: fullName, email, password })
      await refreshMe()
      navigate('/app', { replace: true })
    } catch (err) {
      setError(errorMessage(err) || 'Signup failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start free — no credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link className="saas-link" to="/login">
            Log in
          </Link>
        </>
      }
    >
            <form className="space-y-4" onSubmit={onSubmit}>
              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              ) : null}

              <div>
                <label className="saas-field-label" htmlFor="full_name">
                  Full name
                </label>
                <div className="relative">
                  <Icon
                    name="user"
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint"
                  />
                  <input
                    id="full_name"
                    type="text"
                    name="full_name"
                    required
                    autoComplete="name"
                    placeholder="Enter your name"
                    className="saas-input h-10 pl-10"
                  />
                </div>
              </div>

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
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="saas-input h-10 pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="saas-field-label" htmlFor="password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Icon name="lock" size={16} className="pointer-events-none absolute left-3 text-content-faint" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="saas-input h-10 pl-10 pr-11"
                  />
                  <button
                    type="button"
                    className="saas-icon-btn absolute right-1 size-8"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
              </div>

              <div className="flex min-h-11 items-start gap-3 pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  className="mt-1 size-4 rounded border-subtle bg-surface-solid text-[var(--accent-strong)] focus:ring-0"
                  required
                />
                <label htmlFor="terms" className="text-sm leading-relaxed text-content-muted">
                  I agree to the{' '}
                  <Link className="saas-link" to="/terms">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link className="saas-link" to="/privacy">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button type="submit" disabled={isSubmitting} className="saas-btn saas-btn-primary mt-2 h-10 w-full">
                {isSubmitting ? 'Creating…' : 'Create account'}
                
              </button>
            </form>
    </AuthShell>
  )
}
