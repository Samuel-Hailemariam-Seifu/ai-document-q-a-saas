import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/auth'

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
    <div className="min-h-screen bg-background-light p-4 font-display text-slate-900 dark:bg-background-dark dark:text-slate-100 flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-800">
        <h1 className="text-xl font-semibold">Reset password</h1>
        {!hasToken ? (
          <p className="mt-4 text-sm text-rose-600">Missing or invalid reset token.</p>
        ) : done ? (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
            Password updated. You can now log in.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                {error}
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

