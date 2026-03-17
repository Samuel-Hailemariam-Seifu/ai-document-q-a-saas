import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '../components/layout/RootLayout'
import { AppShellLayout } from '../components/layout/AppShellLayout'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { DashboardPage } from '../pages/DashboardPage.tsx'
import { ChatPage } from '../pages/ChatPage.tsx'
import { DocumentsPage } from '../pages/DocumentsPage.tsx'
import { DocumentDetailPage } from '../pages/DocumentDetailPage.tsx'
import { EmptyStatesPage } from '../pages/EmptyStatesPage.tsx'
import { RequireAuth } from '../auth/RequireAuth'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      {
        path: '/app',
        element: <RequireAuth />,
        children: [
          {
            element: <AppShellLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'documents', element: <DocumentsPage /> },
              { path: 'chat', element: <ChatPage /> },
              { path: 'documents/:documentId', element: <DocumentDetailPage /> },
              { path: 'empty', element: <EmptyStatesPage /> },
            ],
          },
        ],
      },
    ],
  },
])

