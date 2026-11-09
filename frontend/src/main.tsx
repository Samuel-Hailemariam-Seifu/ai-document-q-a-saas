import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/common/CustomScrollbar.css'
import App from './App.tsx'

// Apply persisted theme before React mounts to reduce flicker.
try {
  const theme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme !== 'light' && prefersDark))
} catch {
  // keep whatever index.html applied
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
