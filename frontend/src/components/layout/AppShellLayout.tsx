import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

export function AppShellLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

