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
      return 'border-emerald-600/15 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
    case 'processing':
    case 'pending':
      return 'border-amber-600/15 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300'
    case 'failed':
      return 'border-rose-600/15 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300'
    default:
      return 'saas-badge-neutral'
  }
}
