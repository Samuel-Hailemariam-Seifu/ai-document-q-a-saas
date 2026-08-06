import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../services/auth'

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
    <div className="min-h-screen bg-background-light p-4 font-display text-slate-900 dark:bg-background-dark dark:text-slate-100 flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-800">
        <h1 className="text-xl font-semibold">Verify email</h1>
        {!hasToken ? (
          <p className="mt-4 text-sm text-rose-600">Missing or invalid verification token.</p>
        ) : state === 'verifying' ? (
          <p className="mt-4 text-sm text-slate-500">Verifying…</p>
        ) : state === 'ok' ? (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
            Email verified. You can now log in.
          </div>
        ) : state === 'error' ? (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
            {error ?? 'Verification failed'}
          </div>
        ) : null}

        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    </div>
  )
}

