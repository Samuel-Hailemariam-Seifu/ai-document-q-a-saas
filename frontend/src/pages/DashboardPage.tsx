import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  deleteDocument,
  listDocuments,
  reprocessDocument,
  uploadDocument,
  type DocumentListItem,
} from '../services/documents'
import { listRecentChats, type ChatPreview } from '../services/chat'
import { getWorkspaceStats, type WorkspaceStats } from '../services/workspaces'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { useAuth } from '../auth/AuthContext'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { StatusBadge } from '../components/documents/StatusBadge'
import { Icon, type IconName } from '../components/common/Icon'
import { FileTypeIcon } from '../components/documents/FileTypeIcon'
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard'
import { PageHeader } from '../components/layout/PageHeader'
import { formatBytes, formatDate, formatNumber, formatRatio, formatRelativeTime, stripMarkdown } from '../lib/format'
import { isOnboardingComplete } from '../lib/onboarding'

export function DashboardPage() {
  const navigate = useNavigate()
  const { state } = useWorkspaces()
  const { state: authState } = useAuth()
  const [recentDocs, setRecentDocs] = useState<DocumentListItem[]>([])
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([])
  const [stats, setStats] = useState<WorkspaceStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [docsLoaded, setDocsLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [askDraft, setAskDraft] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [reprocessingId, setReprocessingId] = useState<number | null>(null)

  const workspaceId = state.status === 'ready' ? state.activeWorkspaceId : null

  const refreshDocs = useCallback(async () => {
    if (!workspaceId) {
      setRecentDocs([])
      setDocsLoaded(false)
      return
    }
    try {
      const list = await listDocuments(workspaceId)
      setRecentDocs(list.slice(0, 5))
      setDocsLoaded(true)
      setShowOnboarding(list.length === 0 && !isOnboardingComplete(workspaceId))
    } catch {
      setRecentDocs([])
      setDocsLoaded(true)
      setLoadError('Could not load documents')
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

  const refreshAll = useCallback(() => {
    setLoadError(null)
    void refreshDocs()
    void refreshChats()
    void refreshStats()
  }, [refreshDocs, refreshChats, refreshStats])

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
    if (stats.documents_processing || stats.documents_pending) {
      parts.push(
        `${formatNumber((stats.documents_processing || 0) + (stats.documents_pending || 0))} processing`,
      )
    }
    if (stats.documents_failed) parts.push(`${formatNumber(stats.documents_failed)} failed`)
    return parts.length ? parts.join(' · ') : 'No documents yet'
  }, [stats])

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteDocument(id)
        await refreshDocs()
        await refreshStats()
      } catch {
        setLoadError('Failed to delete document')
      }
    },
    [refreshDocs, refreshStats],
  )

  const onReprocess = useCallback(
    async (id: number) => {
      setReprocessingId(id)
      try {
        await reprocessDocument(id)
        await refreshDocs()
        await refreshStats()
      } catch {
        setLoadError('Retry processing failed')
      } finally {
        setReprocessingId(null)
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
    [workspaceId, refreshDocs, refreshStats],
  )


  const onAsk = (e: FormEvent) => {
    e.preventDefault()
    const q = askDraft.trim()
    if (!q) return
    navigate(`/app/chat?q=${encodeURIComponent(q)}`)
  }

  const firstName =
    authState.status === 'authenticated'
      ? (authState.user.full_name || '').trim().split(/\s+/)[0] || null
      : null
  const greeting = greetingForHour(new Date().getHours())
  const processingCount = (stats?.documents_processing || 0) + (stats?.documents_pending || 0)

  const kpis: Array<{ label: string; value: string; hint: string; icon: IconName }> = [
    {
      label: 'Documents',
      value: stats ? formatNumber(stats.documents_total) : '—',
      hint: docStatusLine ?? 'Loading…',
      icon: 'file',
    },
    {
      label: 'Questions asked',
      value: stats ? formatNumber(stats.ai_queries_total) : '—',
      hint: stats
        ? `${formatNumber(stats.chats_total)} chats · ${formatNumber(stats.messages_total)} messages`
        : 'Loading…',
      icon: 'sparkles',
    },
    {
      label: 'Ingestion success',
      value: stats ? formatRatio(stats.ingestion_success_rate) : '—',
      hint:
        stats?.avg_processing_seconds != null
          ? `Avg. ${stats.avg_processing_seconds.toFixed(1)}s per document`
          : 'No processing data yet',
      icon: 'check',
    },
    {
      label: 'Storage used',
      value: stats ? formatBytes(stats.storage_bytes_total) : '—',
      hint: processingCount ? `${formatNumber(processingCount)} file(s) processing` : 'All files indexed',
      icon: 'layers',
    },
  ]

  const uploadInput = (
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
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        description="Here’s what’s happening in your workspace."
        actions={
          <>
            <button
              type="button"
              className="saas-btn saas-btn-secondary"
              onClick={refreshAll}
              aria-label="Refresh"
              title="Refresh"
            >
              <Icon name="refresh" size={15} className={loadingStats ? 'animate-spin' : undefined} />
              <span className="sm:hidden">Refresh</span>
            </button>
            <label
              className={[
                'saas-btn saas-btn-primary',
                uploading || !workspaceId ? 'pointer-events-none opacity-60' : 'cursor-pointer',
              ].join(' ')}
            >
              {uploadInput}
              <Icon
                name={uploading ? 'hourglass' : 'upload'}
                size={15}
                className={uploading ? 'animate-spin' : undefined}
              />
              {uploading ? 'Uploading…' : 'Upload document'}
            </label>
          </>
        }
      />

      {loadError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <span className="flex items-center gap-2">
            <Icon name="alert" size={16} />
            {loadError}
          </span>
          <button type="button" className="saas-btn saas-btn-secondary saas-btn-sm" onClick={refreshAll}>
            Retry
          </button>
        </div>
      ) : null}

      {uploadMessage ? (
        <div
          role="status"
          className={[
            'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm',
            uploadState === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
          ].join(' ')}
        >
          <Icon name={uploadState === 'error' ? 'alert' : 'check'} size={16} className="mt-0.5 shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      ) : null}

      {workspaceId && docsLoaded && showOnboarding ? (
        <OnboardingWizard
          workspaceId={workspaceId}
          onDone={() => setShowOnboarding(false)}
          onUploaded={() => {
            void refreshDocs()
            void refreshStats()
          }}
        />
      ) : null}

      {/* Ask composer */}
      <form
        onSubmit={onAsk}
        className="rounded-2xl border border-subtle bg-gradient-to-b from-[var(--accent-soft)] to-transparent p-1"
      >
        <div className="rounded-[0.875rem] border border-subtle bg-surface-solid p-4 shadow-raised sm:p-5">
          <label htmlFor="dash-ask" className="flex items-center gap-2 text-sm font-medium text-content">
            <span className="saas-icon-tile-accent size-7 rounded-md">
              <Icon name="sparkles" size={14} />
            </span>
            Ask your documents
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              id="dash-ask"
              className="saas-input h-11 flex-1 text-[0.9375rem]"
              placeholder="e.g. What does our refund policy say about late requests?"
              value={askDraft}
              onChange={(e) => setAskDraft(e.target.value)}
            />
            <button
              type="submit"
              className="saas-btn saas-btn-primary h-11 px-5"
              disabled={!askDraft.trim() || !workspaceId}
            >
              Ask
              <Icon name="arrowRight" size={15} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-content-faint">Try</span>
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                className="rounded-full border border-subtle bg-surface-muted px-2.5 py-1 text-xs text-content-secondary transition-colors hover:border-strong hover:text-content"
                onClick={() => setAskDraft(sug)}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* KPI strip */}
      <section
        aria-label="Workspace metrics"
        className="grid grid-cols-2 overflow-hidden rounded-xl border border-subtle bg-surface-solid shadow-soft lg:grid-cols-4"
      >
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className={[
              'min-w-0 p-4 sm:p-5',
              i % 2 === 1 ? 'border-l border-subtle' : '',
              i >= 2 ? 'border-t border-subtle lg:border-t-0' : '',
              i === 2 ? 'lg:border-l' : '',
            ].join(' ')}
          >
            <div className="flex items-center gap-1.5 text-ui-sm text-content-muted">
              <Icon name={k.icon} size={14} className="text-content-faint" />
              <span className="truncate">{k.label}</span>
            </div>
            {stats || !loadingStats ? (
              <p className="saas-stat mt-3">{k.value}</p>
            ) : (
              <div className="saas-skeleton mt-3 h-6 w-16" />
            )}
            <p className="mt-1.5 truncate text-xs text-content-muted" title={k.hint}>
              {k.hint}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent documents (also a drop target) */}
        <section
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
            'saas-card relative flex flex-col overflow-hidden lg:col-span-3',
            dragOver ? 'ring-2 ring-[var(--accent)]' : '',
          ].join(' ')}
        >
          <div className="saas-card-header">
            <div className="min-w-0">
              <h2 className="saas-section-title">Recent documents</h2>
              <p className="saas-meta mt-0.5 hidden sm:block">Drop a file here to upload</p>
            </div>
            <Link className="saas-btn saas-btn-ghost saas-btn-sm" to="/app/documents">
              View all
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>

          {dragOver ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-solid/90 text-sm font-medium text-accent-text">
              <Icon name="upload" size={22} />
              Drop to upload
            </div>
          ) : null}

          <div className="flex-1">
            {recentDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <span className="saas-icon-tile">
                  <Icon name="folder" size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-content">No documents yet</p>
                  <p className="saas-meta mt-1">Upload a PDF, DOCX or TXT file to start asking questions.</p>
                </div>
                <label className="saas-btn saas-btn-secondary saas-btn-sm cursor-pointer">
                  {uploadInput}
                  <Icon name="upload" size={14} />
                  Upload a file
                </label>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {recentDocs.map((d) => (
                  <li
                    key={d.id}
                    className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-hover"
                  >
                    <FileTypeIcon name={d.original_name} />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/app/documents/${d.id}`}
                        className="block truncate text-sm font-medium text-content hover:underline"
                      >
                        {d.original_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-content-muted">
                        {formatBytes(d.file_size)} · {formatDate(d.created_at)}
                      </p>
                      {d.status === 'failed' && d.error_message ? (
                        <p
                          className="mt-1 truncate text-xs text-rose-600 dark:text-rose-300"
                          title={d.error_message}
                        >
                          {d.error_message}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge status={d.status} />
                    <div className="flex shrink-0 items-center transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                      {d.status === 'failed' ? (
                        <button
                          type="button"
                          className="saas-icon-btn size-8"
                          aria-label="Retry processing"
                          title="Retry processing"
                          disabled={reprocessingId === d.id}
                          onClick={() => void onReprocess(d.id)}
                        >
                          <Icon
                            name="refresh"
                            size={14}
                            className={reprocessingId === d.id ? 'animate-spin' : undefined}
                          />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(d.id)}
                        className="saas-icon-btn size-8 hover:text-rose-600"
                        aria-label="Delete document"
                        title="Delete"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Recent chats */}
        <section className="saas-card flex flex-col overflow-hidden lg:col-span-2">
          <div className="saas-card-header">
            <h2 className="saas-section-title">Recent chats</h2>
            <Link className="saas-btn saas-btn-ghost saas-btn-sm" to="/app/chat">
              <Icon name="plus" size={14} />
              New chat
            </Link>
          </div>
          <div className="flex-1 p-2">
            {recentChats.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <span className="saas-icon-tile">
                  <Icon name="chat" size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-content">No conversations yet</p>
                  <p className="saas-meta mt-1">Ask a question above to start your first chat.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {recentChats.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    to={`/app/chat?chatId=${c.id}`}
                    className="flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover"
                  >
                    <Icon name="chat" size={15} className="mt-0.5 shrink-0 text-content-faint" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium text-content">{c.title}</p>
                        <span className="shrink-0 text-xs text-content-faint">
                          {c.last_message_at ? formatRelativeTime(c.last_message_at) : ''}
                        </span>
                      </div>
                      <p className="saas-meta mt-0.5 line-clamp-2 leading-relaxed">
                        {c.last_message_preview ? stripMarkdown(c.last_message_preview) : 'No messages yet.'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Delete document?"
        description="This permanently removes the document and all of its processed chunks. Answers that cited it will lose their sources."
        confirmLabel="Delete document"
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

const SUGGESTIONS = ['Summarize the key points', 'What are the deadlines?', 'Compare the pricing terms']

function greetingForHour(h: number): string {
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
