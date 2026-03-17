import { useEffect, useMemo, useState } from 'react'

type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme'

function getSystemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  )
}

function applyTheme(pref: ThemePreference) {
  const isDark = pref === 'dark' || (pref === 'system' && getSystemPrefersDark())
  document.documentElement.classList.toggle('dark', isDark)
}

function readInitialTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {}
  return 'system'
}

function nextTheme(pref: ThemePreference): ThemePreference {
  if (pref === 'system') return 'light'
  if (pref === 'light') return 'dark'
  return 'system'
}

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference>(() => readInitialTheme())

  const label = useMemo(() => {
    if (pref === 'system') return 'System'
    if (pref === 'light') return 'Light'
    return 'Dark'
  }, [pref])

  useEffect(() => {
    applyTheme(pref)
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {}
  }, [pref])

  useEffect(() => {
    if (pref !== 'system') return
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = () => applyTheme('system')
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [pref])

  return (
    <button
      type="button"
      onClick={() => setPref((p) => nextTheme(p))}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-primary/20 dark:bg-background-dark/70 dark:text-slate-200 dark:hover:bg-background-dark"
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label} (click to change)`}
    >
      <span className="material-symbols-outlined text-base">
        {pref === 'light' ? 'light_mode' : pref === 'dark' ? 'dark_mode' : 'contrast'}
      </span>
      <span>{label}</span>
    </button>
  )
}

