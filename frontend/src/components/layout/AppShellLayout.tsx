import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

export function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <AppSidebar />

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setMobileOpen(false)
            }}
          />
          <AppSidebar mobile onRequestClose={() => setMobileOpen(false)} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenNav={() => setMobileOpen(true)} />

        <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
