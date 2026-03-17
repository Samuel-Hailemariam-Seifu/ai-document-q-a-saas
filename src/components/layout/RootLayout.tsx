import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthContext'
import { WorkspaceProvider } from '../../workspaces/WorkspaceContext'
import { ThemeToggle } from '../theme/ThemeToggle'

export function RootLayout() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <div className="min-h-screen">
          <div className="fixed right-4 top-4 z-[100]">
            <ThemeToggle />
          </div>
          <Outlet />
        </div>
      </WorkspaceProvider>
    </AuthProvider>
  )
}

