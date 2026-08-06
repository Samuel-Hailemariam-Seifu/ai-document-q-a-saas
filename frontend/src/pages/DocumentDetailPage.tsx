import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteDocument,
  getDocument,
  getDocumentChunks,
  type DocumentChunkItem,
  type DocumentDetail,
} from '../services/documents'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { Icon } from '../components/common/Icon'
import { statusBadgeClass, statusLabel } from '../lib/documents'
import { formatBytes, formatDate, formatNumber } from '../lib/format'

export function DocumentDetailPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [chunks, setChunks] = useState<DocumentChunkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-56 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="saas-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <Icon name="alert" size={24} className="text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? 'Document not found'}</p>
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
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link className="font-medium text-slate-500 hover:text-primary dark:text-slate-400" to="/app/documents">
          Documents
        </Link>
        <Icon name="chevronRight" size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />
        <span className="truncate font-medium text-slate-900 dark:text-white">{doc.original_name}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="saas-title break-words">{doc.original_name}</h1>
          <p className="saas-subtitle flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`saas-badge ${statusBadgeClass(doc.status)}`}>{statusLabel(doc.status)}</span>
            <span>
              Uploaded {formatDate(doc.created_at)} • {formatBytes(doc.file_size)}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link to={`/app/chat?docIds=${doc.id}`} className="saas-btn saas-btn-primary">
            <Icon name="sparkles" size={16} />
            Ask AI
          </Link>
          <button
            type="button"
            className="saas-icon-btn hover:text-rose-600 dark:hover:text-rose-400"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete document"
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      </div>

      {doc.status === 'failed' && doc.error_message ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          <span>{doc.error_message}</span>
        </div>
      ) : null}

      <div className="saas-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <Icon name="info" size={16} className="text-slate-400" />
          <h2 className="saas-section-title">File details</h2>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((d) => (
            <div key={d.label} className="min-w-0">
              <dt className="saas-label">{d.label}</dt>
              <dd className="mt-1.5 truncate text-sm font-medium text-slate-900 dark:text-white" title={d.value}>
                {d.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {doc.status === 'ready' && chunks.length > 0 ? (
        <div className="saas-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Icon name="layers" size={16} className="text-slate-400" />
              <h2 className="saas-section-title">Extracted chunks</h2>
            </div>
            <span className="saas-badge bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {formatNumber(chunks.length)}
            </span>
          </div>
          <div className="custom-scrollbar max-h-[600px] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
            {chunks.map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex items-center gap-2">
                  <span className="saas-badge bg-primary/10 text-primary dark:text-primary-dark">
                    #{String(c.chunk_index + 1).padStart(3, '0')}
                  </span>
                  {c.page_number != null ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Page {c.page_number}</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : doc.status === 'processing' || doc.status === 'pending' ? (
        <div className="saas-card flex flex-col items-center justify-center px-6 py-12 text-center">
          <Icon name="hourglass" size={24} className="text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {doc.status === 'processing'
              ? 'Processing this document — chunks will appear when ready.'
              : 'This document is queued for processing.'}
          </p>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete document?"
        description="This removes the document and all processed chunks."
        confirmLabel="Delete"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          void onDelete()
        }}
      />
    </div>
  )
}
