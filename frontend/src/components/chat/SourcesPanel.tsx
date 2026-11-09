import { useState } from 'react'
import { fileIconName } from '../../lib/documents'
import { excerptPreview, type NumberedCitation } from '../../lib/citations'
import { Icon } from '../common/Icon'

export function SourcesPanel({
  citations,
  activeNumber,
  onHoverNumber,
  onOpenCitation,
}: {
  citations: NumberedCitation[]
  activeNumber: number | null
  onHoverNumber: (n: number | null) => void
  onOpenCitation: (n: number) => void
}) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  if (citations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
        <span className="saas-icon-tile"><Icon name="book" size={16} /></span>
        <p className="text-xs leading-relaxed text-content-muted">
          Sources cited by the assistant will appear here.
        </p>
      </div>
    )
  }

  return (
    <ol>
      {citations.map((c) => {
        const isActive = activeNumber === c.number
        const isOpen = expanded[c.number] === true
        const preview = excerptPreview(c.excerpt)
        const full = c.excerpt.trim()
        const needsMore = full.length > preview.length
        return (
          <li
            key={`${c.chunk_id}-${c.number}`}
            id={`source-${c.number}`}
            className={[
              'mb-2 rounded-xl border bg-surface-solid p-3 shadow-soft transition-colors',
              isActive ? 'border-[var(--accent)] ring-[3px] ring-[color-mix(in_srgb,var(--accent)_15%,transparent)]' : 'border-subtle',
            ].join(' ')}
            onMouseEnter={() => onHoverNumber(c.number)}
            onMouseLeave={() => onHoverNumber(null)}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 text-left"
              onClick={() => onOpenCitation(c.number)}
              onFocus={() => onHoverNumber(c.number)}
              onBlur={() => onHoverNumber(null)}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[10px] font-semibold text-accent-text">
                {c.number}
              </span>
              <Icon name={fileIconName(c.filename)} size={14} className="shrink-0 text-content-muted" />
              <span className="min-w-0 flex-1 truncate text-ui-sm font-medium text-content" title={c.filename}>
                {c.filename}
              </span>
            </button>
            <p className="mt-1 pl-7 text-2xs tabular-nums text-content-faint">
              {c.page_number != null ? `Page ${c.page_number}` : `Chunk ${c.chunk_id}`}
            </p>
            <div className="mt-2.5 rounded-lg bg-surface-muted px-3 py-2.5">
              <p className="text-xs leading-relaxed text-content-secondary">
                {isOpen ? full : preview}
              </p>
              {needsMore ? (
                <button
                  type="button"
                  className="mt-1.5 text-2xs font-medium text-accent-text hover:underline"
                  onClick={() => setExpanded((prev) => ({ ...prev, [c.number]: !isOpen }))}
                >
                  {isOpen ? 'Show less' : 'Show more'}
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
