import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { ThemeToggle } from '../theme/ThemeToggle'

const TITLE_BY_PATH_PREFIX: Array<[prefix: string, title: string]> = [
  ['/app/documents/', 'Document'],
  ['/app/documents', 'Documents'],
  ['/app/chat', 'Chat'],
  ['/app/empty', 'Empty States'],
  ['/app', 'Dashboard'],
]

function titleForPath(pathname: string): string {
  for (const [prefix, title] of TITLE_BY_PATH_PREFIX) {
    if (pathname.startsWith(prefix)) return title
  }
  return 'DocuMind AI'
}

export function AppHeader() {
  const location = useLocation()
  const title = useMemo(() => titleForPath(location.pathname), [location.pathname])

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/70 px-4 backdrop-blur-md dark:border-primary/20 dark:bg-background-dark/60 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white md:text-base">
          {title}
        </h1>
        <div className="hidden h-6 w-px bg-slate-200 dark:bg-primary/20 md:block" />
        <div className="hidden w-[420px] items-center gap-3 rounded-xl bg-slate-100 px-4 py-2 dark:bg-primary/10 md:flex">
          <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
          <input
            className="w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:ring-0 dark:text-slate-100"
            placeholder="Search documents or chats…"
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <ThemeToggle />
        <button
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-primary/10 dark:hover:text-white"
          type="button"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-primary/10 dark:hover:text-white"
          type="button"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-9 w-9 overflow-hidden rounded-full border border-primary/40 bg-primary/20">
          <img
            alt="Avatar"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAU0hDfOdCPuuO14tmQ1jJN_4xdCVrQUdCUyGrUjGm2JfBmddMPyywIrsIXH1LtItlEtLtjFQLY8yj2MupEVMXb_0ZB0RkZJvO42OZsQaO4DC1bw9Yl6RdpRKECAI6CCtI28msHr65yOqAcdSATHFBPtfh_Q92IYtVTgaxa52K_jElZdOXaibOUeN2QYTncIGZHIRNiP6C6vWyfms-bMKise2MaSwbF9G4FJZULRZhjQEVoXv5PfPszK0oLOCK3EcHDqM6xEgXwc51O"
          />
        </div>
      </div>
    </header>
  )
}

