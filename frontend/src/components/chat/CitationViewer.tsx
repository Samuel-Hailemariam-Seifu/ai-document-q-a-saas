import { useEffect } from 'react'
import { fileIconName } from '../../lib/documents'
import type { NumberedCitation } from '../../lib/citations'
import { Icon } from '../common/Icon'

export function CitationViewer({
  open,
  citations,
  index,
  onClose,
  onIndexChange,
}: {
  open: boolean
  citations: NumberedCitation[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}) {
  const citation = citations[index] ?? null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1)
      if (e.key === 'ArrowRight' && index < citations.length - 1) onIndexChange(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, citations.length, onClose, onIndexChange])

  if (!open || !citation) return null

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 animate-fade-in bg-zinc-950/40 backdrop-blur-[2px]"
        aria-label="Close document viewer"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-xl animate-pop-in flex-col border-l border-subtle bg-surface-solid shadow-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Cited passage"
      >
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-subtle px-4">
          <Icon name={fileIconName(citation.filename)} size={18} className="text-content-muted" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-content">{citation.filename}</p>
            <p className="text-2xs text-content-muted">
              Source [{citation.number}]
              {citation.page_number != null ? ` · page ${citation.page_number}` : ` · chunk ${citation.chunk_id}`}
            </p>
          </div>
          <button type="button" className="saas-icon-btn" aria-label="Close viewer" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-xs font-medium text-content-muted">Cited passage</p>
          {/* Solid reading surface; PDF binary viewer needs GET /file (not yet approved). */}
          <div className="rounded-xl border border-subtle bg-surface-muted/60 p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-content">
              <mark className="rounded bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-0.5 text-content [box-decoration-break:clone]">{citation.excerpt}</mark>
            </p>
          </div>
          <p className="mt-4 text-xs text-content-muted">
            Full PDF page jump needs character offsets / file download from the API. Showing the retrieved chunk for
            now.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-subtle px-4 py-3">
          <button
            type="button"
            className="saas-btn saas-btn-secondary"
            disabled={index <= 0}
            onClick={() => onIndexChange(index - 1)}
          >
            Previous
          </button>
          <p className="text-xs tabular-nums text-content-muted">
            {index + 1} / {citations.length}
          </p>
          <button
            type="button"
            className="saas-btn saas-btn-secondary"
            disabled={index >= citations.length - 1}
            onClick={() => onIndexChange(index + 1)}
          >
            Next
          </button>
        </div>
      </aside>
    </div>
  )
}
