import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteDocument,
  getDocument,
  getDocumentChunks,
  type DocumentChunkItem,
  type DocumentDetail,
} from '../services/documents'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusDisplay(status: string): { label: string; healthy: boolean } {
  switch (status) {
    case 'ready':
      return { label: 'Ready', healthy: true }
    case 'processing':
    case 'pending':
      return { label: status === 'processing' ? 'Processing…' : 'Pending', healthy: false }
    case 'failed':
      return { label: 'Failed', healthy: false }
    default:
      return { label: status, healthy: false }
  }
}

export function DocumentDetailPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [chunks, setChunks] = useState<DocumentChunkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      const [d, chunkList] = await Promise.all([
        getDocument(id),
        getDocumentChunks(id).catch(() => []),
      ])
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
    if (!doc || !window.confirm('Delete this document?')) return
    try {
      await deleteDocument(doc.id)
      navigate('/app/documents', { replace: true })
    } catch {
      setError('Failed to delete')
    }
  }, [doc, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light font-display dark:bg-background-dark">
        <p className="text-slate-500">Loading…</p>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-light font-display dark:bg-background-dark">
        <p className="text-slate-500">{error ?? 'Document not found'}</p>
        <Link to="/app/documents" className="text-primary hover:underline">
          Back to Documents
        </Link>
      </div>
    )
  }

  const statusInfo = statusDisplay(doc.status)

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="relative flex w-full flex-col overflow-x-hidden">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 backdrop-blur-md dark:border-primary/20 dark:bg-background-dark/50 lg:px-40">
          <div className="flex items-center gap-4">
            <Link to="/app" className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined">description</span>
            </Link>
            <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              DocuMind AI
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-primary/30 dark:bg-primary/20 dark:text-white"
              type="button"
              aria-label="More"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
              type="button"
              onClick={onDelete}
              aria-label="Delete"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-40">
          <div className="mx-auto max-w-5xl space-y-6">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="font-medium text-slate-500 hover:text-primary dark:text-primary/70"
                to="/app/documents"
              >
                My Documents
              </Link>
              <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
              <span className="font-medium text-slate-900 dark:text-white">{doc.original_name}</span>
            </nav>

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {doc.original_name}
                </h1>
                <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-primary/60">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  Uploaded {new Date(doc.created_at).toLocaleDateString()} • {formatSize(doc.file_size)}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/app/chat"
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  Ask AI
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/10">
                <p className="text-sm font-medium text-slate-500 dark:text-primary/70">Status</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {statusInfo.label}
                  </p>
                  {statusInfo.healthy ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-500">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Healthy
                    </span>
                  ) : doc.status === 'failed' && doc.error_message ? (
                    <span className="text-xs text-rose-500" title={doc.error_message}>
                      Error
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/10">
                <p className="text-sm font-medium text-slate-500 dark:text-primary/70">Chunks</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{doc.chunk_count}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/10">
                <p className="text-sm font-medium text-slate-500 dark:text-primary/70">Pages</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {doc.page_count ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-primary/20 dark:bg-primary/10">
              <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-primary">info</span>
                File Details
              </h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 py-2 dark:border-primary/10">
                  <span className="text-slate-500 dark:text-primary/60">Type</span>
                  <span className="font-medium text-slate-900 dark:text-white">{doc.mime_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-2 dark:border-primary/10">
                  <span className="text-slate-500 dark:text-primary/60">Size</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatSize(doc.file_size)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 dark:text-primary/60">Pages</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {doc.page_count ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            {doc.status === 'ready' && chunks.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-primary/20 dark:bg-primary/5">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-primary/20 dark:bg-primary/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary/70">
                    Extracted Chunks
                  </span>
                </div>
                <div className="custom-scrollbar max-h-[600px] space-y-6 overflow-y-auto p-6">
                  {chunks.map((c) => (
                    <div key={c.id} className="group space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          CHUNK #{String(c.chunk_index + 1).padStart(3, '0')}
                        </span>
                        {c.page_number != null && (
                          <span className="text-xs text-slate-500">Page {c.page_number}</span>
                        )}
                        <div className="h-px flex-1 bg-slate-100 dark:bg-primary/10" />
                      </div>
                      <div className="rounded-lg border border-transparent bg-slate-50 p-4 transition-all group-hover:border-primary/30 dark:bg-primary/5">
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {doc.status === 'processing' && (
              <p className="text-sm text-slate-500">Processing document… chunks will appear when ready.</p>
            )}
            {doc.status === 'pending' && (
              <p className="text-sm text-slate-500">Document is queued for processing.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
