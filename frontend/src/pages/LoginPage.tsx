import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { login } from '../services/auth'
import { AuthShell } from '../components/auth/AuthShell'
import { Icon } from '../components/common/Icon'

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message?: unknown }).message ?? '')
  return ''
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { refreshMe } = useAuth()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const form = new FormData(e.currentTarget as HTMLFormElement)
      const email = String(form.get('email') ?? '')
      const password = String(form.get('password') ?? '')
      await login({ email, password })
      await refreshMe()
      const next = params.get('next')
      navigate(next ? decodeURIComponent(next) : '/app', { replace: true })
    } catch (err) {
      setError(errorMessage(err) || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your workspace to continue."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link className="saas-link" to="/signup">
            Sign up for free
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
              autoComplete="email"
              placeholder="name@company.com"
              className="saas-input h-10 pl-10"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="saas-field-label" htmlFor="password">
              Password
            </label>
            <Link className="text-xs font-medium text-content-muted transition-colors hover:text-content" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
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
              autoComplete="current-password"
              placeholder="••••••••"
              className="saas-input h-10 pl-10 pr-11"
              required
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

        <button type="submit" disabled={isSubmitting} className="saas-btn saas-btn-primary mt-2 h-10 w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
          
        </button>
      </form>
    </AuthShell>
  )
}
