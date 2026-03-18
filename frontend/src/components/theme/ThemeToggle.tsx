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
  return 'dark'
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
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-primary/20 dark:bg-background-dark/70 dark:text-slate-200 dark:hover:bg-background-dark"
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label} (click to change)`}
    >
      <Icon name={pref === 'light' ? 'sun' : 'moon'} size={16} className="text-slate-700 dark:text-slate-200" />
      <span>{label}</span>
    </button>
  )
}

