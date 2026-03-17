import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '../components/layout/RootLayout'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ChatPage } from '../pages/ChatPage'
import { DocumentDetailPage } from '../pages/DocumentDetailPage'
import { EmptyStatesPage } from '../pages/EmptyStatesPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/app', element: <DashboardPage /> },
      { path: '/app/chat', element: <ChatPage /> },
      { path: '/app/documents/:documentId', element: <DocumentDetailPage /> },
      { path: '/app/empty', element: <EmptyStatesPage /> },
    ],
  },
])

