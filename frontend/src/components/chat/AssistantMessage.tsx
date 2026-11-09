import { useState } from 'react'
import { citationFootnotes, type NumberedCitation } from '../../lib/citations'
import { formatDateTime, formatRelativeTime } from '../../lib/format'
import { Markdown } from '../common/Markdown'
import { Icon } from '../common/Icon'

export function AssistantMessage({
  content,
  createdAt,
  citations,
  emptyRetrieval,
  searchedDocNames,
  activeNumber,
  onHoverNumber,
  onOpenCitation,
  onRegenerate,
  canRegenerate,
}: {
  content: string
  createdAt: string
  citations: NumberedCitation[]
  emptyRetrieval?: boolean
  searchedDocNames?: string[]
  activeNumber: number | null
  onHoverNumber: (n: number | null) => void
  onOpenCitation: (n: number) => void
  onRegenerate?: () => void
  canRegenerate?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const copy = async () => {
    const text = citationFootnotes(content, citations)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // ignore
    }
  }

  if (emptyRetrieval) {
    return (
      <div className="flex gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 text-white shadow-soft">
          <Icon name="sparkles" size={14} />
        </span>
        <div className="min-w-0 flex-1 rounded-xl border border-subtle bg-surface-muted/50 p-4">
          <p className="font-heading text-heading-sm font-semibold text-content">
            I couldn&apos;t find this in your documents
          </p>
          <p className="mt-2 text-sm text-content-secondary">{content}</p>
          {searchedDocNames && searchedDocNames.length > 0 ? (
            <p className="mt-3 text-xs text-content-muted">
              Searched: {searchedDocNames.slice(0, 6).join(', ')}
              {searchedDocNames.length > 6 ? ` +${searchedDocNames.length - 6} more` : ''}
            </p>
          ) : (
            <p className="mt-3 text-xs text-content-muted">No documents were in scope for this question.</p>
          )}
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-content-secondary">
            <li>Try rephrasing with terms that appear in the files</li>
            <li>Upload more documents that cover this topic</li>
            <li>Widen the source scope in the composer</li>
          </ul>
          {canRegenerate && onRegenerate ? (
            <button type="button" className="saas-btn saas-btn-secondary mt-4" onClick={onRegenerate}>
              <Icon name="refresh" size={14} />
              Try again
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="group flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 text-white shadow-soft">
        <Icon name="sparkles" size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="pt-0.5">
          <Markdown>{content}</Markdown>

          {citations.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {citations.map((c) => (
                <button
                  key={c.number}
                  type="button"
                  className={[
                    'inline-flex h-7 max-w-[14rem] items-center gap-1.5 rounded-full border pl-1 pr-2.5 text-xs transition-colors',
                    activeNumber === c.number
                      ? 'border-[var(--accent)] bg-accent-soft text-content'
                      : 'border-subtle bg-surface-solid text-content-secondary hover:border-strong hover:text-content',
                  ].join(' ')}
                  aria-label={`Open source ${c.number}: ${c.filename}`}
                  onMouseEnter={() => onHoverNumber(c.number)}
                  onMouseLeave={() => onHoverNumber(null)}
                  onFocus={() => onHoverNumber(c.number)}
                  onBlur={() => onHoverNumber(null)}
                  onClick={() => onOpenCitation(c.number)}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[10px] font-semibold text-accent-text">
                    {c.number}
                  </span>
                  <span className="truncate">{c.filename}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <p className="mr-2 text-2xs tabular-nums text-content-faint" title={formatDateTime(createdAt)}>
            {formatRelativeTime(createdAt)}
          </p>
          <button
            type="button"
            className="saas-icon-btn size-7"
            aria-label={copied ? 'Copied' : 'Copy answer with sources'}
            title={copied ? 'Copied' : 'Copy with citations'}
            onClick={() => void copy()}
          >
            <Icon name={copied ? 'checkMark' : 'copy'} size={15} />
          </button>
          <button
            type="button"
            className={[
              'saas-icon-btn size-9 min-h-9 min-w-9',
              feedback === 'up' ? 'text-accent' : '',
            ].join(' ')}
            aria-label="Thumbs up"
            title="Helpful (stored locally until feedback API exists)"
            onClick={() => setFeedback((v) => (v === 'up' ? null : 'up'))}
          >
            <Icon name="thumbsUp" size={15} />
          </button>
          <button
            type="button"
            className={[
              'saas-icon-btn size-9 min-h-9 min-w-9',
              feedback === 'down' ? 'text-danger' : '',
            ].join(' ')}
            aria-label="Thumbs down"
            title="Not helpful (stored locally until feedback API exists)"
            onClick={() => setFeedback((v) => (v === 'down' ? null : 'down'))}
          >
            <Icon name="thumbsDown" size={15} />
          </button>
          {canRegenerate && onRegenerate ? (
            <button
              type="button"
              className="saas-icon-btn size-7"
              aria-label="Regenerate answer"
              title="Regenerate"
              onClick={onRegenerate}
            >
              <Icon name="refresh" size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
