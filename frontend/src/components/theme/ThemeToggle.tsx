import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../common/Icon'

type ThemePreference = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function applyTheme(pref: ThemePreference) {
  const isDark = pref === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
}

function readInitialTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    // ignore
  }
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function nextTheme(pref: ThemePreference): ThemePreference {
  return pref === 'dark' ? 'light' : 'dark'
}

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference>(() => readInitialTheme())

  const label = useMemo(() => {
    return pref === 'light' ? 'Light' : 'Dark'
  }, [pref])

  useEffect(() => {
    applyTheme(pref)
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      // ignore
    }
  }, [pref])

  return (
    <button
      type="button"
      onClick={() => setPref((p) => nextTheme(p))}
      className="saas-icon-btn"
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label} (click to change)`}
    >
      <Icon name={pref === 'light' ? 'sun' : 'moon'} size={16} />
    </button>
  )
}

