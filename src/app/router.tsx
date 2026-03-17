import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '../components/layout/RootLayout'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
])

