import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteDocument,
  getDocument,
  getDocumentChunks,
  reprocessDocument,
  type DocumentChunkItem,
  type DocumentDetail,
} from '../services/documents'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { Icon } from '../components/common/Icon'
import { statusLabel } from '../lib/documents'
import { StatusBadge } from '../components/documents/StatusBadge'
import { FileTypeIcon } from '../components/documents/FileTypeIcon'
import { formatBytes, formatDate, formatNumber } from '../lib/format'

export function DocumentDetailPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [chunks, setChunks] = useState<DocumentChunkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reprocessing, setReprocessing] = useState(false)

  const id = documentId ? Number(documentId) : NaN

  const refresh = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      setError('Invalid document')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [d, chunkList] = await Promise.all([getDocument(id), getDocumentChunks(id).catch(() => [])])
      setDoc(d)
      setChunks(chunkList)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load document')
      setDoc(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const onDelete = useCallback(async () => {
    if (!doc) return
    try {
      await deleteDocument(doc.id)
      navigate('/app/documents', { replace: true })
    } catch {
      setError('Failed to delete')
    }
  }, [doc, navigate])

  const onReprocess = useCallback(async () => {
    if (!doc) return
    setReprocessing(true)
    setError(null)
    try {
      await reprocessDocument(doc.id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry processing failed')
    } finally {
      setReprocessing(false)
    }
  }, [doc, refresh])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="saas-skeleton h-4 w-28" />
        <div className="flex items-center gap-4">
          <div className="saas-skeleton h-11 w-10" />
          <div className="flex-1 space-y-2">
            <div className="saas-skeleton h-6 w-72" />
            <div className="saas-skeleton h-4 w-48" />
          </div>
        </div>
        <div className="saas-skeleton h-72 rounded-xl" />
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="saas-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <span className="saas-icon-tile size-12 rounded-xl">
          <Icon name="alert" size={20} />
        </span>
        <p className="text-sm text-content-muted">{error ?? 'Document not found'}</p>
        <Link to="/app/documents" className="saas-btn saas-btn-secondary">
          <Icon name="arrowLeft" size={16} />
          Back to documents
        </Link>
      </div>
    )
  }

  const details: Array<{ label: string; value: string }> = [
    { label: 'Status', value: statusLabel(doc.status) },
    { label: 'Chunks', value: formatNumber(doc.chunk_count) },
    { label: 'Pages', value: doc.page_count != null ? formatNumber(doc.page_count) : '—' },
    { label: 'Size', value: formatBytes(doc.file_size) },
    { label: 'Type', value: doc.mime_type },
    { label: 'Uploaded', value: formatDate(doc.created_at) },
  ]

  return (
    <div className="space-y-6">
      <Link
        to="/app/documents"
        className="inline-flex items-center gap-1.5 text-ui-sm font-medium text-content-muted transition-colors hover:text-content"
      >
        <Icon name="arrowLeft" size={14} />
        All documents
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <FileTypeIcon name={doc.original_name} size="lg" />
          <div className="min-w-0">
            <h1 className="saas-title break-words">{doc.original_name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-content-muted">
              <StatusBadge status={doc.status} />
              <span>{formatBytes(doc.file_size)}</span>
              <span className="text-content-faint">·</span>
              <span>Uploaded {formatDate(doc.created_at)}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {doc.status === 'failed' || doc.status === 'pending' ? (
            <button
              type="button"
              className="saas-btn saas-btn-secondary"
              disabled={reprocessing}
              onClick={() => void onReprocess()}
            >
              <Icon name="refresh" size={15} className={reprocessing ? 'animate-spin' : undefined} />
              {reprocessing ? 'Retrying…' : 'Retry processing'}
            </button>
          ) : null}
          <button
            type="button"
            className="saas-btn saas-btn-secondary hover:text-rose-600 dark:hover:text-rose-400"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete document"
            title="Delete document"
          >
            <Icon name="trash" size={15} />
          </button>
          <Link to={`/app/chat?docIds=${doc.id}`} className="saas-btn saas-btn-primary">
            <Icon name="sparkles" size={15} />
            Ask about this file
          </Link>
        </div>
      </div>

      {doc.status === 'failed' ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
            <span>{doc.error_message || 'Processing failed. Retry to run ingestion again.'}</span>
          </div>
          <button
            type="button"
            className="saas-btn saas-btn-secondary saas-btn-sm shrink-0"
            disabled={reprocessing}
            onClick={() => void onReprocess()}
          >
            <Icon name="refresh" size={14} className={reprocessing ? 'animate-spin' : undefined} />
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {doc.status === 'ready' && chunks.length > 0 ? (
            <div className="saas-card overflow-hidden">
              <div className="saas-card-header">
                <div>
                  <h2 className="saas-section-title">Extracted passages</h2>
                  <p className="saas-meta mt-0.5">The assistant cites these chunks when it answers.</p>
                </div>
                <span className="saas-badge saas-badge-neutral tabular">{formatNumber(chunks.length)}</span>
              </div>
              <ol className="custom-scrollbar max-h-[640px] divide-y divide-[var(--border-subtle)] overflow-y-auto">
                {chunks.map((c) => (
                  <li key={c.id} className="flex gap-4 px-5 py-4">
                    <span className="mt-0.5 w-10 shrink-0 font-mono text-xs text-content-faint">
                      #{String(c.chunk_index + 1).padStart(3, '0')}
                    </span>
                    <div className="min-w-0">
                      {c.page_number != null ? (
                        <p className="mb-1 text-xs font-medium text-content-muted">Page {c.page_number}</p>
                      ) : null}
                      <p className="text-sm leading-relaxed text-content-secondary">{c.content}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : doc.status === 'processing' || doc.status === 'pending' ? (
            <div className="saas-card flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="saas-icon-tile size-12 rounded-xl">
                <Icon name="hourglass" size={20} className="animate-spin" />
              </span>
              <p className="mt-4 text-sm font-medium text-content">
                {doc.status === 'processing' ? 'Processing document' : 'Queued for processing'}
              </p>
              <p className="saas-meta mt-1 max-w-xs">
                We’re extracting text and building embeddings. Passages will appear here when it’s ready.
              </p>
            </div>
          ) : (
            <div className="saas-card flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="saas-icon-tile size-12 rounded-xl">
                <Icon name="layers" size={20} />
              </span>
              <p className="mt-4 text-sm font-medium text-content">No passages available</p>
              <p className="saas-meta mt-1">Retry processing to extract text from this file.</p>
            </div>
          )}
        </div>

        <aside className="saas-card overflow-hidden lg:sticky lg:top-0">
          <div className="saas-card-header">
            <h2 className="saas-section-title">Details</h2>
          </div>
          <dl className="divide-y divide-[var(--border-subtle)]">
            {details.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-content-muted">{d.label}</dt>
                <dd className="min-w-0 truncate text-right text-sm font-medium text-content" title={d.value}>
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete document?"
        description="This permanently removes the document and all of its processed chunks."
        confirmLabel="Delete document"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          void onDelete()
        }}
      />
    </div>
  )
}
