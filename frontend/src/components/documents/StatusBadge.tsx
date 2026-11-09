import { statusBadgeClass, statusLabel } from '../../lib/documents'

export function StatusBadge({ status }: { status: string }) {
  const busy = status === 'processing' || status === 'pending'
  return (
    <span className={`saas-badge ${statusBadgeClass(status)}`}>
      <span className="relative flex size-1.5">
        {busy ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" /> : null}
        <span className="saas-dot relative" />
      </span>
      {statusLabel(status)}
    </span>
  )
}
