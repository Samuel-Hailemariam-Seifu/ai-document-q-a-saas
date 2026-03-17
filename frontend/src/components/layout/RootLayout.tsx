import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthContext'
import { WorkspaceProvider } from '../../workspaces/WorkspaceContext'

export function RootLayout() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <div className="min-h-screen">
          <Outlet />
        </div>
      </WorkspaceProvider>
    </AuthProvider>
  )
}

