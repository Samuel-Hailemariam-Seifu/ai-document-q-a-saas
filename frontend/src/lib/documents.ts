import type { IconName } from '../components/common/Icon'

export function fileIconName(filename: string): IconName {
  return filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'file'
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'ready':
      return 'Ready'
    case 'processing':
      return 'Processing'
    case 'pending':
      return 'Pending'
    case 'failed':
      return 'Failed'
    default:
      return status
  }
}

/** Tailwind classes for a status pill, paired with the `saas-badge` base class. */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'ready':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
    case 'processing':
    case 'pending':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
    case 'failed':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
  }
}
