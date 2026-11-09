import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import {
  deleteDocument,
  listDocuments,
  reprocessDocument,
  uploadDocument,
  type DocumentListItem,
} from '../services/documents'
import { atDocumentLimit, getUsageSnapshot, type UsageSnapshot } from '../services/usage'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { StatusBadge } from '../components/documents/StatusBadge'
import { Icon } from '../components/common/Icon'
import { PageHeader } from '../components/layout/PageHeader'
import { FileTypeIcon } from '../components/documents/FileTypeIcon'
import { formatBytes, formatDate, formatNumber } from '../lib/format'

type StatusFilter = 'all' | 'ready' | 'processing' | 'failed'

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Ready' },
  { id: 'processing', label: 'Processing' },
  { id: 'failed', label: 'Failed' },
]

function matchesFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'processing') return status === 'processing' || status === 'pending'
  return status === filter
}

export function DocumentsPage() {
  const { state: wsState } = useWorkspaces()
  const [docs, setDocs] = useState<DocumentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const [reprocessingId, setReprocessingId] = useState<number | null>(null)
  const [reprocessError, setReprocessError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    file: File
    existing: DocumentListItem
  } | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [usage, setUsage] = useState<UsageSnapshot | null>(null)

  const workspaceId = wsState.status === 'ready' ? wsState.activeWorkspaceId : null
  const docsAtLimit = usage ? atDocumentLimit(usage) : false

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setDocs([])
      setUsage(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const [list, snap] = await Promise.all([
        listDocuments(workspaceId),
        getUsageSnapshot(workspaceId).catch(() => null),
      ])
      setDocs(list)
      setUsage(snap)
    } catch (e) {
      setDocs([])
      setLoadError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Light poll while any doc is processing
  useEffect(() => {
    const busy = docs.some((d) => d.status === 'processing' || d.status === 'pending')
    if (!busy || !workspaceId) return
    const t = window.setInterval(() => {
      void refresh()
    }, 4000)
    return () => window.clearInterval(t)
  }, [docs, workspaceId, refresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs.filter((d) => {
      if (!matchesFilter(d.status, statusFilter)) return false
      if (!q) return true
      return d.original_name.toLowerCase().includes(q)
    })
  }, [docs, query, statusFilter])

  const uploadFile = useCallback(
    async (file: File) => {
      if (!workspaceId) return
      if (usage && atDocumentLimit(usage)) {
        setUploadError(
          `Document limit reached (${formatNumber(usage.documentsUsed)} / ${formatNumber(usage.documentsLimit)}). Upgrade to add more.`,
        )
        return
      }
      setUploadError(null)
      setUploading(true)
      try {
        await uploadDocument(workspaceId, file)
        await refresh()
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [workspaceId, refresh, usage],
  )

  const handleFile = useCallback(
    async (file: File) => {
      if (!workspaceId) return
      // Soft duplicate check (name + size) until content-hash API exists.
      const existing = docs.find(
        (d) => d.original_name === file.name && d.file_size === file.size,
      )
      if (existing) {
        setDuplicatePrompt({ file, existing })
        return
      }
      await uploadFile(file)
    },
    [workspaceId, docs, uploadFile],
  )

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteDocument(id)
        setSelectedIds((prev) => prev.filter((x) => x !== id))
        await refresh()
      } catch {
        setLoadError('Failed to delete document')
      }
    },
    [refresh],
  )

  const onBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return
    setBulkBusy(true)
    try {
      await Promise.all(selectedIds.map((id) => deleteDocument(id)))
      setSelectedIds([])
      await refresh()
    } catch {
      setLoadError('Some documents could not be deleted')
    } finally {
      setBulkBusy(false)
      setPendingBulkDelete(false)
    }
  }, [selectedIds, refresh])

  const onReprocess = useCallback(
    async (id: number) => {
      setReprocessError(null)
      setReprocessingId(id)
      try {
        await reprocessDocument(id)
        await refresh()
      } catch (e) {
        setReprocessError(e instanceof Error ? e.message : 'Retry processing failed')
      } finally {
        setReprocessingId(null)
      }
    },
    [refresh],
  )

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAllFiltered = () => {
    const ids = filtered.map((d) => d.id)
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id))
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])))
  }

  if (wsState.status !== 'ready' || !workspaceId) {
    return (
      <div className="saas-card flex flex-col items-center justify-center px-6 py-14 text-center">
        <Icon name="workspaces" size={24} className="text-content-muted" />
        <p className="mt-3 text-sm text-content-muted">Select or create a workspace first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Everything the assistant can read and cite. New uploads are processed in the background."
        actions={
          <>
            <button type="button" className="saas-btn saas-btn-secondary" aria-label="Refresh" title="Refresh" onClick={() => void refresh()}>
              <Icon name="refresh" size={15} className={loading ? 'animate-spin' : undefined} />
              <span className="sm:hidden">Refresh</span>
            </button>
            {docsAtLimit ? (
              <Link to="/app/billing" className="saas-btn saas-btn-primary">
                <Icon name="crown" size={16} />
                Upgrade to upload
              </Link>
            ) : (
              <label className="saas-btn saas-btn-primary cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) void handleFile(file)
                  }}
                />
                <Icon name={uploading ? 'hourglass' : 'upload'} size={15} className={uploading ? 'animate-spin' : undefined} />
                {uploading ? 'Uploading…' : 'Upload document'}
              </label>
            )}
          </>
        }
      />

      {docsAtLimit && usage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <span className="flex items-start gap-2">
            <Icon name="crown" size={16} className="mt-0.5 shrink-0" />
            Document limit reached ({formatNumber(usage.documentsUsed)} / {formatNumber(usage.documentsLimit)}
            ). Upgrade to add more files.
          </span>
          <Link to="/app/billing" className="saas-btn saas-btn-secondary">
            View plans
          </Link>
        </div>
      ) : null}

      {uploadError || reprocessError ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <Icon name="alert" size={16} className="shrink-0" />
          {uploadError || reprocessError}
        </div>
      ) : null}

      {loadError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <span>{loadError}</span>
          <button type="button" className="saas-btn saas-btn-secondary saas-btn-sm" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!docsAtLimit) setDragOver(true)
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
          setDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (docsAtLimit) return
          const file = e.dataTransfer.files?.[0]
          if (file) void handleFile(file)
        }}
        className={[
          'saas-card relative overflow-hidden transition-shadow',
          dragOver ? 'ring-2 ring-[var(--accent)]' : '',
        ].join(' ')}
      >
        {dragOver ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-surface-solid/90 text-sm font-medium text-accent-text backdrop-blur-[1px]">
            <span className="saas-icon-tile-accent size-11 rounded-xl">
              <Icon name="upload" size={20} />
            </span>
            Drop to upload
          </div>
        ) : null}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-subtle p-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Filter by status"
            className="flex w-full gap-0.5 overflow-x-auto rounded-lg bg-surface-muted p-0.5 sm:w-auto"
          >
            {FILTERS.map((f) => {
              const active = statusFilter === f.id
              const count = docs.filter((d) => matchesFilter(d.status, f.id)).length
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={[
                    'inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-ui-sm font-medium transition-colors sm:flex-none',
                    active
                      ? 'bg-surface-solid text-content shadow-raised'
                      : 'text-content-muted hover:text-content',
                  ].join(' ')}
                  onClick={() => setStatusFilter(f.id)}
                >
                  {f.label}
                  <span className={['tabular text-xs', active ? 'text-content-muted' : 'text-content-faint'].join(' ')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="relative min-w-0 sm:w-72">
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by file name…"
              className="saas-input pl-9 shadow-none"
              aria-label="Search documents"
            />
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle bg-accent-soft px-5 py-2">
            <p className="text-ui-sm font-medium text-content">
              {selectedIds.length} selected
              <button type="button" className="ml-3 text-content-muted hover:text-content" onClick={() => setSelectedIds([])}>
                Clear
              </button>
            </p>
            <button
              type="button"
              className="saas-btn saas-btn-danger saas-btn-sm"
              disabled={bulkBusy}
              onClick={() => setPendingBulkDelete(true)}
            >
              <Icon name="trash" size={14} />
              Delete selected
            </button>
          </div>
        ) : null}

        {loading && docs.length === 0 ? (
          <div className="divide-y divide-[var(--border-subtle)]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="saas-skeleton size-8" />
                <div className="flex-1 space-y-2">
                  <div className="saas-skeleton h-3.5 w-1/3" />
                  <div className="saas-skeleton h-3 w-1/5" />
                </div>
                <div className="saas-skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="saas-icon-tile size-12 rounded-xl">
              <Icon name="upload" size={20} />
            </span>
            <h3 className="mt-4 saas-section-title">Upload your first document</h3>
            <p className="mt-1 max-w-sm text-sm text-content-muted">
              Drag a PDF, DOCX or TXT file anywhere on this card, or browse your computer. Files up to 25MB.
            </p>
            {!docsAtLimit ? (
              <label className="saas-btn saas-btn-primary mt-5 cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) void handleFile(file)
                  }}
                />
                <Icon name="upload" size={15} />
                Browse files
              </label>
            ) : null}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="saas-icon-tile size-12 rounded-xl">
              <Icon name="search" size={20} />
            </span>
            <h3 className="mt-4 saas-section-title">No matching documents</h3>
            <p className="mt-1 text-sm text-content-muted">Try a different search or status filter.</p>
            <button
              type="button"
              className="saas-btn saas-btn-secondary saas-btn-sm mt-4"
              onClick={() => {
                setQuery('')
                setStatusFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="saas-table min-w-[44rem]">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-strong bg-surface-solid text-[var(--accent-strong)] focus:ring-0"
                      checked={filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id))}
                      onChange={toggleAllFiltered}
                      aria-label="Select all visible documents"
                    />
                  </th>
                  <th className="w-1/2">Name</th>
                  <th>Status</th>
                  <th className="text-right">Size</th>
                  <th>Uploaded</th>
                  <th className="w-px">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const selected = selectedIds.includes(d.id)
                  return (
                    <tr key={d.id} className={['group', selected ? 'bg-accent-soft' : ''].join(' ')}>
                      <td>
                        <input
                          type="checkbox"
                          className="size-4 rounded border-strong bg-surface-solid text-[var(--accent-strong)] focus:ring-0"
                          checked={selected}
                          onChange={() => toggleSelected(d.id)}
                          aria-label={`Select ${d.original_name}`}
                        />
                      </td>
                      <td className="max-w-0">
                        <Link to={`/app/documents/${d.id}`} className="flex min-w-0 items-center gap-3">
                          <FileTypeIcon name={d.original_name} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-content group-hover:underline">
                              {d.original_name}
                            </span>
                            {d.status === 'failed' && d.error_message ? (
                              <span
                                className="block truncate text-xs text-rose-600 dark:text-rose-300"
                                title={d.error_message}
                              >
                                {d.error_message}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="tabular text-right text-content-muted">{formatBytes(d.file_size)}</td>
                      <td className="tabular whitespace-nowrap text-content-muted">{formatDate(d.created_at)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-0.5 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
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
                                size={15}
                                className={reprocessingId === d.id ? 'animate-spin' : undefined}
                              />
                            </button>
                          ) : null}
                          <Link
                            to={`/app/documents/${d.id}`}
                            className="saas-icon-btn size-8"
                            aria-label="Open document"
                            title="Open"
                          >
                            <Icon name="externalLink" size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(d.id)}
                            className="saas-icon-btn size-8 hover:text-rose-600 dark:hover:text-rose-400"
                            aria-label="Delete document"
                            title="Delete"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="flex items-center justify-between border-t border-subtle px-5 py-2.5 text-xs text-content-muted">
            <span>
              Showing {formatNumber(filtered.length)} of {formatNumber(docs.length)} documents
            </span>
            <span className="hidden sm:inline">PDF, DOCX or TXT · max 25MB · drop files to upload</span>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Delete document?"
        description="This permanently removes the document and all of its processed chunks."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId == null) return
          void onDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />

      <ConfirmDialog
        open={pendingBulkDelete}
        title={`Delete ${selectedIds.length} documents?`}
        description="This removes the selected documents and all processed chunks."
        confirmLabel="Delete all"
        onCancel={() => setPendingBulkDelete(false)}
        onConfirm={() => void onBulkDelete()}
      />

      {duplicatePrompt ? (
        <div
          className="saas-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Possible duplicate"
        >
          <div className="saas-dialog max-w-md">
            <p className="text-base font-semibold tracking-tight text-content">Possible duplicate</p>
            <p className="mt-2 text-sm text-content-secondary">
              A file named <span className="font-medium text-content">{duplicatePrompt.file.name}</span> with the same
              size already exists ({formatBytes(duplicatePrompt.existing.file_size)}).
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="saas-btn saas-btn-ghost"
                onClick={() => setDuplicatePrompt(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="saas-btn saas-btn-secondary"
                onClick={() => {
                  const { file } = duplicatePrompt
                  setDuplicatePrompt(null)
                  void uploadFile(file)
                }}
              >
                Keep both
              </button>
              <button
                type="button"
                className="saas-btn saas-btn-primary"
                onClick={() => {
                  const { file, existing } = duplicatePrompt
                  setDuplicatePrompt(null)
                  void (async () => {
                    await deleteDocument(existing.id)
                    await uploadFile(file)
                  })()
                }}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
