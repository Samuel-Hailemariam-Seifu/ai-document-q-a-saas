import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { login } from '../services/auth'

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
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'Login failed'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light p-4 font-display text-slate-900 dark:bg-background-dark dark:text-slate-100 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2 text-white">
              <span className="material-symbols-outlined text-3xl">
                auto_stories
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              DocuMind AI
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Intelligent document analysis for everyone
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-8">
            <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please enter your details to sign in
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                {error}
              </div>
            ) : null}
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400">
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="password"
                >
                  Password
                </label>
                <a className="text-xs font-semibold text-primary hover:underline" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400">
                  lock
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-xl">
                    visibility
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 bg-transparent text-primary focus:ring-primary dark:border-slate-700"
              />
              <label
                className="text-sm text-slate-600 dark:text-slate-400"
                htmlFor="remember"
              >
                Remember for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              Sign in
              <span className="material-symbols-outlined text-xl">
                arrow_forward
              </span>
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 dark:bg-[#1a1835]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <img
                  alt="Google Logo"
                  className="h-4 w-4"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaQ2CXV6-pNX4aNEb2doDTQFV_szORGEeAv3YISYe1RPCL-4GUeXjqip88TNiBtw4JA1eDIqTVsqRyfnCBOKLfKS7w3kLs3gbMOgIho5kXjX-8eD9sdy-Z7kRoIDhHgkirFJ_QNVbFt4ISa8itTPpPqRaRvYI4fXOJttxvF0ksoUNI3jmJKITs32d5B93Lm2ci35lcYb2WrMHH6mPD6KzTD3AQuHeCecHBkYVXt-juqFITfvojH4HlfILAR9pBZzgjg7XkZg-ZxtPf"
                />
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-xl">ios</span>
                Apple
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-primary hover:underline" to="/signup">
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="fixed bottom-6 flex gap-6 text-xs text-slate-500 dark:text-slate-600">
        <a className="transition-colors hover:text-slate-900 dark:hover:text-slate-300" href="#">
          Privacy Policy
        </a>
        <a className="transition-colors hover:text-slate-900 dark:hover:text-slate-300" href="#">
          Terms of Service
        </a>
        <a className="transition-colors hover:text-slate-900 dark:hover:text-slate-300" href="#">
          Help Center
        </a>
      </div>
    </div>
  )
}

