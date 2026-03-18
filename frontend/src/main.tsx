import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/common/CustomScrollbar.css'
import App from './App.tsx'

// Apply persisted theme before React mounts to reduce flicker.
try {
  const theme = localStorage.getItem('theme')
  document.documentElement.classList.toggle('dark', theme !== 'light')
} catch {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
