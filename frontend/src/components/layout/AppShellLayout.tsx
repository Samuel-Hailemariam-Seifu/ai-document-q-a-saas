import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

export function AppShellLayout() {
  return (
    <div className="h-screen overflow-hidden bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="h-full p-3 md:p-5">
        <div className="saas-board flex h-full min-h-0 overflow-hidden">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader />
            <main className="min-h-0 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 py-6 md:px-6 md:py-7">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

