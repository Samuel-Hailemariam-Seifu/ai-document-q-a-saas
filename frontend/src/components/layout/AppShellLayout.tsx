import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'

export function AppShellLayout() {
  const location = useLocation()
  const isChatPage = location.pathname.startsWith('/app/chat')
  const [mobileOpen, setMobileOpen] = useState(false)

  const mobileButtonClass = useMemo(
    () =>
      [
        'fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/85 p-2 text-slate-700 shadow-lg backdrop-blur transition-colors hover:bg-white md:hidden',
        'dark:border-primary/20 dark:bg-background-dark/70 dark:text-slate-200 dark:hover:bg-primary/10',
      ].join(' '),
    [],
  )

  return (
    <div className="h-screen overflow-hidden bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="h-full">
        <div className="saas-board flex h-full min-h-0 overflow-hidden">
          <AppSidebar />
          {/* Mobile nav trigger */}
          <button
            type="button"
            className={mobileButtonClass}
            aria-label="Open menu"
            title="Menu"
            onClick={() => setMobileOpen(true)}
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          {/* Mobile drawer */}
          {mobileOpen ? (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setMobileOpen(false)
                }}
              />
              <AppSidebar mobile onRequestClose={() => setMobileOpen(false)} />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="min-h-0 flex-1 overflow-hidden">
              <div
                className={
                  isChatPage
                    ? 'h-full min-h-0 overflow-hidden'
                    : 'custom-scrollbar h-full overflow-y-auto px-4 pb-0 pt-16 md:px-6 md:py-6 md:pt-6'
                }
              >
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

