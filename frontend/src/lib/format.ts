export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatNumber(n: number): string {
  try {
    return new Intl.NumberFormat().format(n)
  } catch {
    return String(n)
  }
}

/** Formats a 0..1 ratio as a percentage. */
export function formatRatio(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  const pct = Math.max(0, Math.min(1, safe)) * 100
  return `${pct.toFixed(pct < 10 ? 1 : 0)}%`
}

export function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return '—'
  }
}

export function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return '—'
  }
}

export function formatTime(value: string): string {
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
