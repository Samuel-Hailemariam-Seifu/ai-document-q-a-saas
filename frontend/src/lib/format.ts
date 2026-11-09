export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb >= 10 ? gb.toFixed(0) : gb.toFixed(1)} GB`
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Absolute calendar date, e.g. "7 Nov 2026". */
export function formatDate(value: string): string {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return '—'
  }
}

/** Date + time without seconds, e.g. "7 Nov 2026, 10:42". */
export function formatDateTime(value: string): string {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${formatDate(value)}, ${time}`
  } catch {
    return '—'
  }
}

/** Clock time without seconds. Prefer formatRelativeTime in chat. */
export function formatTime(value: string): string {
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

/** Relative chat timestamps ("2 min ago", "Yesterday"); never includes seconds. */
export function formatRelativeTime(value: string, nowMs: number = Date.now()): string {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const diffMs = nowMs - d.getTime()
    const abs = Math.abs(diffMs)
    const minute = 60_000
    const hour = 60 * minute
    const day = 24 * hour

    if (abs < minute) return 'Just now'
    if (abs < hour) {
      const mins = Math.floor(abs / minute)
      return `${mins} min ago`
    }
    if (abs < day) {
      const hours = Math.floor(abs / hour)
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    }

    const startOfToday = new Date(nowMs)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfMsg = new Date(d)
    startOfMsg.setHours(0, 0, 0, 0)
    const dayDiff = Math.round((startOfToday.getTime() - startOfMsg.getTime()) / day)

    if (dayDiff === 1) return 'Yesterday'
    if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago`
    return formatDate(value)
  } catch {
    return ''
  }
}

/** Strip common Markdown syntax for plain-text previews (lists, emphasis, links, code). */
export function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
