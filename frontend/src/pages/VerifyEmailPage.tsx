import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../services/auth'
import { AuthShell } from '../components/auth/AuthShell'
import { Icon } from '../components/common/Icon'

function msg(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message?: unknown }).message ?? '')
  return ''
}

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'idle' | 'verifying' | 'ok' | 'error'>(() =>
    token.length >= 10 ? 'verifying' : 'idle',
  )
  const [error, setError] = useState<string | null>(null)

  const hasToken = useMemo(() => token.length >= 10, [token])

  useEffect(() => {
    if (!hasToken) return
    let cancelled = false
    void verifyEmail(token)
      .then(() => {
        if (cancelled) return
        setState('ok')
      })
      .catch((e) => {
        if (cancelled) return
        setError(msg(e) || 'Verification failed')
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [token, hasToken])

  return (
    <AuthShell
      title="Verify email"
      subtitle="Confirm your address to finish setup"
      footer={
        <Link to="/login" className="saas-link">
          Go to login
        </Link>
      }
    >
      {!hasToken ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          Missing or invalid verification token.
        </div>
      ) : state === 'verifying' ? (
        <p className="flex items-center gap-2 text-sm text-content-muted">
          <Icon name="hourglass" size={16} className="animate-spin" />
          Verifying…
        </p>
      ) : state === 'ok' ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Icon name="check" size={16} className="mt-0.5 shrink-0" />
          Email verified. You can now log in.
        </div>
      ) : state === 'error' ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error ?? 'Verification failed'}
        </div>
      ) : null}
    </AuthShell>
  )
}
