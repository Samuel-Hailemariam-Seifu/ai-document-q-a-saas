import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDocument, listDocuments, uploadDocument, type DocumentListItem } from '../services/documents'
import { listRecentChats, type ChatPreview } from '../services/chat'
import { getWorkspaceStats, type WorkspaceStats } from '../services/workspaces'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { Icon, type IconName } from '../components/common/Icon'
import { PageHeader } from '../components/layout/PageHeader'
import { fileIconName, statusBadgeClass, statusLabel } from '../lib/documents'
import { formatBytes, formatDate, formatDateTime, formatNumber, formatRatio } from '../lib/format'

export function DashboardPage() {
  const { state } = useWorkspaces()
  const [recentDocs, setRecentDocs] = useState<DocumentListItem[]>([])
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([])
  const [stats, setStats] = useState<WorkspaceStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const workspaceId = state.status === 'ready' ? state.activeWorkspaceId : null

  const refreshDocs = useCallback(async () => {
    if (!workspaceId) {
      setRecentDocs([])
      return
    }
    try {
      const list = await listDocuments(workspaceId)
      setRecentDocs(list.slice(0, 5))
    } catch {
      setRecentDocs([])
    }
  }, [workspaceId])

  const refreshChats = useCallback(async () => {
    if (!workspaceId) {
      setRecentChats([])
      return
    }
    try {
      setRecentChats(await listRecentChats(workspaceId, 6))
    } catch {
      setRecentChats([])
    }
  }, [workspaceId])

  const refreshStats = useCallback(
    async (signal?: AbortSignal) => {
      if (!workspaceId) {
        setStats(null)
        return
      }
      setLoadingStats(true)
      try {
        const s = await getWorkspaceStats(workspaceId)
        if (!signal?.aborted) setStats(s)
      } catch {
        if (!signal?.aborted) setStats(null)
      } finally {
        if (!signal?.aborted) setLoadingStats(false)
      }
    },
    [workspaceId],
  )

  useEffect(() => {
    const controller = new AbortController()
    const t = window.setTimeout(() => {
      void refreshDocs()
      void refreshChats()
      void refreshStats(controller.signal)
    }, 0)
    return () => {
      controller.abort()
      window.clearTimeout(t)
    }
  }, [refreshDocs, refreshChats, refreshStats])

  const docStatusLine = useMemo(() => {
    if (!stats) return null
    const parts: string[] = []
    if (stats.documents_ready) parts.push(`${formatNumber(stats.documents_ready)} ready`)
    if (stats.documents_processing) parts.push(`${formatNumber(stats.documents_processing)} processing`)
    if (stats.documents_pending) parts.push(`${formatNumber(stats.documents_pending)} pending`)
    if (stats.documents_failed) parts.push(`${formatNumber(stats.documents_failed)} failed`)
    return parts.length ? parts.join(' • ') : 'No documents yet'
  }, [stats])

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteDocument(id)
        await refreshDocs()
        await refreshStats()
      } catch {
        // ignore
      }
    },
    [refreshDocs, refreshStats],
  )

  const handleFile = useCallback(
    async (file: File) => {
      if (!workspaceId) return
      setUploadMessage(null)
      setUploading(true)
      setUploadState('uploading')
      try {
        await uploadDocument(workspaceId, file)
        setUploadState('success')
        setUploadMessage(`"${file.name}" uploaded. Processing will start shortly.`)
        await refreshDocs()
        await refreshChats()
        await refreshStats()
      } catch (e) {
        setUploadState('error')
        setUploadMessage(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setUploading(false)
        window.setTimeout(() => {
          setUploadState('idle')
          setUploadMessage(null)
        }, 5000)
      }
    },
    [workspaceId, refreshDocs, refreshChats, refreshStats],
  )

  const summaryCards: Array<{ label: string; value: string; icon: IconName }> = [
    { label: 'Documents', value: stats ? formatNumber(stats.documents_total) : '—', icon: 'file' },
    { label: 'Ready', value: stats ? formatNumber(stats.documents_ready) : '—', icon: 'check' },
    { label: 'Chats', value: stats ? formatNumber(stats.chats_total) : '—', icon: 'chat' },
    { label: 'Questions asked', value: stats ? formatNumber(stats.ai_queries_total) : '—', icon: 'zap' },
  ]

  const ingestionMetrics = [
    { label: 'Ingestion success', value: stats ? formatRatio(stats.ingestion_success_rate) : '—' },
    {
      label: 'Avg processing',
      value: stats?.avg_processing_seconds != null ? `${Math.round(stats.avg_processing_seconds)}s` : '—',
    },
    { label: 'Citations / answer', value: stats ? stats.citations_per_answer.toFixed(1) : '—' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Upload documents, monitor processing, and ask questions with citations."
        actions={
          <button
            type="button"
            className="saas-btn saas-btn-secondary"
            onClick={() => {
              void refreshDocs()
              void refreshChats()
              void refreshStats()
            }}
          >
            <Icon name="refresh" size={16} className={loadingStats ? 'animate-spin' : undefined} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="saas-card p-5">
            <div className="flex items-center gap-2 text-slate-400">
              <Icon name={s.icon} size={15} />
              <p className="saas-label">{s.label}</p>
            </div>
            <p className="saas-stat mt-3">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file) void handleFile(file)
            }}
            className={[
              'rounded-xl border border-dashed p-6 transition-colors',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-surface-dark',
            ].join(' ')}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary-dark">
                  <Icon name="upload" size={20} />
                </span>
                <div>
                  <h2 className="saas-section-title">Upload documents</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    PDF, DOCX or TXT up to 25MB. Processing runs in the background.
                  </p>
                </div>
              </div>

              <label className="saas-btn saas-btn-primary cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={uploading || !workspaceId}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) void handleFile(file)
                  }}
                />
                <Icon name={uploading ? 'hourglass' : 'upload'} size={16} />
                {uploading ? 'Uploading…' : 'Choose file'}
              </label>
            </div>

            {uploadMessage ? (
              <div
                className={[
                  'mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
                  uploadState === 'error'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                ].join(' ')}
              >
                <Icon name={uploadState === 'error' ? 'alert' : 'check'} size={16} className="mt-0.5 shrink-0" />
                <span>{uploadMessage}</span>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {ingestionMetrics.map((m) => (
                <div key={m.label} className="saas-card-muted p-4">
                  <p className="saas-label">{m.label}</p>
                  <p className="mt-2 font-heading text-[15px] font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="saas-card flex flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="saas-section-title">Recent chats</h2>
            <Link className="text-sm font-semibold text-primary hover:underline dark:text-primary-dark" to="/app/chat">
              Open
            </Link>
          </div>
          <div className="flex-1 p-3">
            {recentChats.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <Icon name="chat" size={20} className="text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No chats yet. Upload a document and ask your first question.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {recentChats.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    to={`/app/chat?chatId=${c.id}`}
                    className="rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{c.title}</p>
                    <p className="saas-meta mt-0.5 line-clamp-1">{c.last_message_preview ?? 'No messages yet.'}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {c.last_message_at ? formatDateTime(c.last_message_at) : '—'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="saas-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="saas-section-title">Recent documents</h2>
            {docStatusLine ? (
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{docStatusLine}</p>
            ) : null}
          </div>
          <Link
            className="shrink-0 text-sm font-semibold text-primary hover:underline dark:text-primary-dark"
            to="/app/documents"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Document</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Chunks</th>
                <th className="px-5 py-3 font-semibold">Uploaded</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                    No documents yet. Upload a file above to get started.
                  </td>
                </tr>
              ) : (
                recentDocs.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-5 py-3">
                      <Link to={`/app/documents/${d.id}`} className="flex items-center gap-3 hover:text-primary">
                        <Icon name={fileIconName(d.original_name)} size={16} className="shrink-0 text-slate-400" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 dark:text-white">
                            {d.original_name}
                          </span>
                          <span className="saas-meta">{formatBytes(d.file_size)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`saas-badge ${statusBadgeClass(d.status)}`}>{statusLabel(d.status)}</span>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                      {formatNumber(d.chunk_count)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                      {formatDate(d.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/app/documents/${d.id}`} className="saas-icon-btn" aria-label="Open document">
                          <Icon name="externalLink" size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(d.id)}
                          className="saas-icon-btn hover:text-rose-600 dark:hover:text-rose-400"
                          aria-label="Delete document"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Delete document?"
        description="This removes the document and all processed chunks."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId == null) return
          void onDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}
