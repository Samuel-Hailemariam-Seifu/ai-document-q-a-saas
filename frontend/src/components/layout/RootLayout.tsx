import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthContext'
import { WorkspaceProvider } from '../../workspaces/WorkspaceContext'
import { OfflineBanner } from '../system/OfflineBanner'

export function RootLayout() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <div className="min-h-screen">
          <OfflineBanner />
          <Outlet />
        </div>
      </WorkspaceProvider>
    </AuthProvider>
  )
}
