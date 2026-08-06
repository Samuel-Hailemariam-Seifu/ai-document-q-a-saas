import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { deleteDocument, listDocuments, uploadDocument, type DocumentListItem } from '../services/documents'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { Icon } from '../components/common/Icon'
import { PageHeader } from '../components/layout/PageHeader'
import { fileIconName, statusBadgeClass, statusLabel } from '../lib/documents'
import { formatBytes, formatDate } from '../lib/format'

export function DocumentsPage() {
  const { state: wsState } = useWorkspaces()
  const [docs, setDocs] = useState<DocumentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const workspaceId = wsState.status === 'ready' ? wsState.activeWorkspaceId : null

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setDocs([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setDocs(await listDocuments(workspaceId))
    } catch {
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleFile = useCallback(
    async (file: File) => {
      if (!workspaceId) return
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
    [workspaceId, refresh],
  )

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteDocument(id)
        await refresh()
      } catch {
        // ignore
      }
    },
    [refresh],
  )

  if (wsState.status !== 'ready' || !workspaceId) {
    return (
      <div className="saas-card flex flex-col items-center justify-center px-6 py-14 text-center">
        <Icon name="workspaces" size={24} className="text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Select or create a workspace first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Upload PDF, TXT or DOCX files up to 25MB. Processing runs in the background."
        actions={
          <>
            <button type="button" className="saas-btn saas-btn-secondary" onClick={() => void refresh()}>
              <Icon name="refresh" size={16} className={loading ? 'animate-spin' : undefined} />
              Refresh
            </button>
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
              <Icon name={uploading ? 'hourglass' : 'upload'} size={16} />
              {uploading ? 'Uploading…' : 'Upload'}
            </label>
          </>
        }
      />

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
          'flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-surface-dark',
        ].join(' ')}
      >
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary-dark">
          <Icon name="upload" size={20} />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">Drag and drop a file here</p>
        <p className="saas-meta mt-1">PDF, TXT or DOCX — max 25MB</p>
        {uploadError ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400">
            <Icon name="alert" size={14} />
            {uploadError}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="saas-card divide-y divide-slate-200 dark:divide-slate-800">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 p-5">
              <div className="size-5 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="saas-card flex flex-col items-center justify-center px-6 py-14 text-center">
          <Icon name="folder" size={28} className="text-slate-300 dark:text-slate-600" />
          <h3 className="mt-3 saas-section-title">No documents yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload your first file to make it searchable and citation-ready.
          </p>
        </div>
      ) : (
        <div className="saas-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="saas-section-title">All documents</h2>
            <span className="saas-badge bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {docs.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Size</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Uploaded</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {docs.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-5 py-3">
                      <Link
                        to={`/app/documents/${d.id}`}
                        className="flex items-center gap-3 font-medium text-slate-900 hover:text-primary dark:text-white"
                      >
                        <Icon name={fileIconName(d.original_name)} size={16} className="shrink-0 text-slate-400" />
                        <span className="truncate">{d.original_name}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                      {formatBytes(d.file_size)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`saas-badge ${statusBadgeClass(d.status)}`}>{statusLabel(d.status)}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
