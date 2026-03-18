import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDocument, listDocuments, uploadDocument, type DocumentListItem } from '../services/documents'
import { listRecentChats, type ChatPreview } from '../services/chat'
import { getWorkspaceStats, type WorkspaceStats } from '../services/workspaces'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatCount(n: number): string {
  try {
    return new Intl.NumberFormat().format(n)
  } catch {
    return String(n)
  }
}

function formatPercent01(v: number): string {
  const n = Number.isFinite(v) ? v : 0
  const pct = Math.max(0, Math.min(1, n)) * 100
  return `${pct.toFixed(pct < 10 ? 1 : 0)}%`
}

function statusClass(status: string): string {
  switch (status) {
    case 'ready':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'processing':
    case 'pending':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'failed':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }
}

function iconForFile(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'picture_as_pdf'
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'description'
  return 'article'
}

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
      setRecentDocs(list.slice(0, 4))
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
      const list = await listRecentChats(workspaceId, 6)
      setRecentChats(list)
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
    if (stats.documents_ready) parts.push(`${formatCount(stats.documents_ready)} ready`)
    if (stats.documents_processing) parts.push(`${formatCount(stats.documents_processing)} processing`)
    if (stats.documents_pending) parts.push(`${formatCount(stats.documents_pending)} pending`)
    if (stats.documents_failed) parts.push(`${formatCount(stats.documents_failed)} failed`)
    return parts.length ? parts.join(' • ') : 'No documents yet'
  }, [stats])

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteDocument(id)
        await refreshDocs()
        const controller = new AbortController()
        await refreshStats(controller.signal)
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
        const controller = new AbortController()
        await refreshStats(controller.signal)
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="saas-title">Dashboard</h1>
          <p className="saas-subtitle">
            Upload documents, monitor status, and ask questions with citations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void refreshDocs()
            void refreshChats()
            void refreshStats()
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/5 sm:w-auto sm:justify-start"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      <section className="saas-gradient-panel p-6 md:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Document Q&A Assistant</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Good day, keep your knowledge at hand</h2>
            <p className="mt-2 text-sm text-white/85">
              Upload, ask, and verify answers with citations in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/15 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-white/75">Ingestion</p>
              <p className="mt-1 text-lg font-bold">{stats ? formatPercent01(stats.ingestion_success_rate) : '—'}</p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-white/75">Citations / Answer</p>
              <p className="mt-1 text-lg font-bold">{stats ? stats.citations_per_answer.toFixed(1) : '—'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1) Stats overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Documents', value: stats ? formatCount(stats.documents_total) : '—', icon: 'description' },
          { label: 'Ready Documents', value: stats ? formatCount(stats.documents_ready) : '—', icon: 'task_alt' },
          { label: 'Total Chats', value: stats ? formatCount(stats.chats_total) : '—', icon: 'chat_bubble' },
          { label: 'Total Questions', value: stats ? formatCount(stats.ai_queries_total) : '—', icon: 'bolt' },
        ].map((s) => (
          <div key={s.label} className="saas-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                <h3 className="mt-2 truncate text-3xl font-extrabold">{s.value}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{docStatusLine}</p>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
            </div>
            {loadingStats ? (
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full w-1/2 animate-pulse bg-primary/70" />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 2) Upload section */}
        <section className="lg:col-span-7">
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
              'saas-card border-2 border-dashed p-6 transition-colors',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-slate-300',
            ].join(' ')}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[28px]">upload_file</span>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold">Upload documents</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    PDF, DOCX, TXT • Max 25MB • Processing runs in the background
                  </p>
                  {uploadMessage ? (
                    <p
                      className={[
                        'mt-3 inline-flex rounded-lg px-3 py-1 text-xs font-semibold',
                        uploadState === 'success'
                          ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                          : uploadState === 'error'
                            ? 'bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
                            : 'bg-slate-100 text-slate-700 dark:bg-primary/10 dark:text-slate-200',
                      ].join(' ')}
                    >
                      {uploadMessage}
                    </p>
                  ) : null}
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
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
                <span className="material-symbols-outlined text-[20px]">
                  {uploading ? 'hourglass_top' : 'upload_file'}
                </span>
                {uploading ? 'Uploading…' : 'Choose file'}
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Ingestion success', value: stats ? formatPercent01(stats.ingestion_success_rate) : '—' },
                { label: 'Avg processing time', value: stats?.avg_processing_seconds != null ? `${Math.round(stats.avg_processing_seconds)}s` : '—' },
                { label: 'Citations per answer', value: stats ? stats.citations_per_answer.toFixed(1) : '—' },
              ].map((m) => (
                <div key={m.label} className="saas-card-muted p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{m.label}</p>
                  <p className="mt-2 text-xl font-extrabold">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4) Recent chats */}
        <section className="lg:col-span-5">
          <div className="saas-card">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-primary/20">
              <div>
                <h3 className="text-lg font-extrabold">Recent chats</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump back into an ongoing analysis.</p>
              </div>
              <Link className="text-sm font-semibold text-primary hover:underline" to="/app/chat">
                Open Chat
              </Link>
            </div>
            <div className="p-4">
              {recentChats.length === 0 ? (
                <div className="saas-card-muted p-5 text-sm text-slate-600 dark:text-slate-300">
                  No chats yet. Upload a document and ask your first question.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChats.slice(0, 1).map((c) => (
                    <Link
                      key={c.id}
                      to={`/app/chat?chatId=${c.id}`}
                      className="saas-card block p-4 transition-colors hover:bg-slate-50 dark:hover:bg-primary/10"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{c.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                            {c.last_message_preview ?? 'No messages yet.'}
                          </p>
                        </div>
                        <div className="shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
                          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : '—'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 3) Recent documents table */}
      <section className="saas-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-primary/20">
          <div>
            <h3 className="text-lg font-extrabold">Recent documents</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track ingestion status and open documents.</p>
          </div>
          <Link className="text-sm font-semibold text-primary hover:underline" to="/app/documents">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-primary/10 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Document</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Chunks</th>
                <th className="px-6 py-4 font-semibold">Uploaded</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-primary/20">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    No documents yet. Upload a file above to get started.
                  </td>
                </tr>
              ) : (
                recentDocs.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-primary/5">
                    <td className="px-6 py-4">
                      <Link
                        to={`/app/documents/${d.id}`}
                        className="flex items-center gap-3 font-semibold text-slate-900 hover:text-primary dark:text-white"
                      >
                        <span className="material-symbols-outlined text-primary">{iconForFile(d.original_name)}</span>
                        <div className="min-w-0">
                          <p className="truncate">{d.original_name}</p>
                          <p className="text-xs text-slate-500">{formatSize(d.file_size)}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatCount(d.chunk_count)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/app/documents/${d.id}`}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-primary/10"
                          aria-label="View"
                        >
                          <span className="material-symbols-outlined">open_in_new</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(d.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-primary/10"
                          aria-label="Delete"
                        >
                          <span className="material-symbols-outlined">delete</span>
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

