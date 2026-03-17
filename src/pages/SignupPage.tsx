import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    // Phase 2: wire to backend auth/register
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-primary/20 md:px-12">
        <div className="flex items-center gap-2 text-primary">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">description</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            DocuMind AI
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
            Already have an account?
          </span>
          <Link
            to="/login"
            className="flex h-10 min-w-[84px] items-center justify-center rounded-xl bg-primary/10 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl shadow-primary/5 dark:border-primary/20 dark:bg-primary/5">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                Create your account
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400">
                Join DocuMind AI to start analyzing documents with intelligence.
              </p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:ring-2 focus:ring-primary dark:border-primary/30 dark:bg-background-dark dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:ring-2 focus:ring-primary dark:border-primary/30 dark:bg-background-dark dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-xl text-slate-400">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a password"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:ring-2 focus:ring-primary dark:border-primary/30 dark:bg-background-dark dark:text-white dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    className="absolute right-4 text-slate-400 transition-colors hover:text-primary"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="size-5 rounded border-slate-300 bg-white text-primary focus:ring-primary dark:border-primary/30 dark:bg-background-dark"
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-tight text-slate-500 dark:text-slate-400"
                >
                  I agree to the{' '}
                  <a className="text-primary hover:underline" href="#">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a className="text-primary hover:underline" href="#">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary/90"
              >
                Create Account
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-primary/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500 dark:bg-[#1a182e] dark:text-slate-400">
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-primary/30 dark:hover:bg-primary/10"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Google
                </span>
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-primary/30 dark:hover:bg-primary/10"
              >
                <svg
                  className="h-5 w-5 fill-slate-900 dark:fill-white"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  GitHub
                </span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            © 2024 DocuMind AI. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  )
}

