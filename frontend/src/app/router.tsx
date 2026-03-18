import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '../components/layout/RootLayout'
import { AppShellLayout } from '../components/layout/AppShellLayout'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { VerifyEmailPage } from '../pages/VerifyEmailPage'
import { DashboardPage } from '../pages/DashboardPage.tsx'
import { ChatPage } from '../pages/ChatPage.tsx'
import { DocumentsPage } from '../pages/DocumentsPage.tsx'
import { DocumentDetailPage } from '../pages/DocumentDetailPage.tsx'
import { EmptyStatesPage } from '../pages/EmptyStatesPage.tsx'
import { BillingPage } from '../pages/BillingPage.tsx'
import { SettingsPage } from '../pages/SettingsPage.tsx'
import { RequireAuth } from '../auth/RequireAuth'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      {
        path: '/app',
        element: <RequireAuth />,
        children: [
          // Full-page chat (not inside AppShellLayout)
          { path: 'chat', element: <ChatPage /> },
          {
            element: <AppShellLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'documents', element: <DocumentsPage /> },
              { path: 'billing', element: <BillingPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'documents/:documentId', element: <DocumentDetailPage /> },
              { path: 'empty', element: <EmptyStatesPage /> },
            ],
          },
        ],
      },
    ],
  },
])

