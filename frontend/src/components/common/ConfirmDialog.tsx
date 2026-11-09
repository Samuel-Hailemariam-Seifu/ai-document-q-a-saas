import { useEffect } from 'react'
import { Icon } from './Icon'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="saas-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="saas-dialog max-w-md">
        <div className="flex gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <Icon name="alert" size={18} />
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-base font-semibold tracking-tight text-content">{title}</p>
            {description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-content-muted">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="saas-btn saas-btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="saas-btn saas-btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

