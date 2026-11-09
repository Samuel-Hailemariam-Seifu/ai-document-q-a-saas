import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

/**
 * Inset app shell: the sidebar sits on the canvas and page content lives in a
 * raised panel (desktop). On mobile the panel goes edge-to-edge and the
 * sidebar becomes a drawer.
 */
export function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-canvas flex h-screen overflow-hidden font-display text-content">
      <AppSidebar />

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-zinc-950/50 backdrop-blur-[2px]"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setMobileOpen(false)
            }}
          />
          <AppSidebar mobile onRequestClose={() => setMobileOpen(false)} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-solid md:rounded-xl md:border md:border-subtle md:shadow-raised">
          <AppHeader onOpenNav={() => setMobileOpen(true)} />

          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:px-10 md:py-9">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
