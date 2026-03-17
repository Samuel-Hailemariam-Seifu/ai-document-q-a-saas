import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  type DocumentListItem,
} from '../services/documents'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'ready':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
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

export function DocumentsPage() {
  const { state: wsState } = useWorkspaces()
  const [docs, setDocs] = useState<DocumentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const workspaceId = wsState.status === 'ready' ? wsState.activeWorkspaceId : null

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setDocs([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const list = await listDocuments(workspaceId)
      setDocs(list)
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
    [workspaceId, refresh]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) void handleFile(file)
    },
    [handleFile]
  )

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  const onDelete = useCallback(
    async (id: number) => {
      if (!window.confirm('Delete this document?')) return
      try {
        await deleteDocument(id)
        await refresh()
      } catch {
        // ignore
      }
    },
    [refresh]
  )

  if (wsState.status !== 'ready' || !workspaceId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light font-display dark:bg-background-dark">
        <p className="text-slate-500">Select or create a workspace first.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-background-light px-6 py-4 dark:border-primary/20 dark:bg-background-dark md:px-20">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2 text-white">
            <span className="material-symbols-outlined block">bubble_chart</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">DocuMind AI</h2>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/app"
            className="rounded-full p-2 transition-colors hover:bg-slate-200 dark:hover:bg-primary/20"
            aria-label="Dashboard"
          >
            <span className="material-symbols-outlined">dashboard</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row">
        <aside className="flex w-full flex-col gap-2 border-r border-slate-200 p-6 dark:border-primary/20 md:w-64">
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-primary/10"
            to="/app"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary">
            <span className="material-symbols-outlined">folder</span>
            <span>Documents</span>
          </div>
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-primary/10"
            to="/app/chat"
          >
            <span className="material-symbols-outlined">chat</span>
            <span>Chats</span>
          </Link>
        </aside>

        <main className="flex flex-1 flex-col gap-10 overflow-y-auto p-6 md:p-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">My Documents</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Upload PDF, TXT, or DOCX (max 25MB). Processing runs in the background.
            </p>
          </div>

          <section className="flex flex-col gap-6">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-300 bg-slate-100 dark:border-primary/20 dark:bg-primary/5'
              }`}
            >
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-3xl">upload_file</span>
              </div>
              <p className="mb-2 font-semibold">Drag and drop or choose a file</p>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                PDF, TXT, DOCX — max 25MB
              </p>
              <label className="cursor-pointer rounded-xl bg-primary px-6 py-2.5 font-semibold text-white transition-all hover:bg-primary/90">
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={onFileInput}
                  disabled={uploading}
                />
                {uploading ? 'Uploading…' : 'Browse Files'}
              </label>
              {uploadError && (
                <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{uploadError}</p>
              )}
            </div>

            {loading ? (
              <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-primary/10" />
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 py-16 dark:border-primary/10 dark:bg-primary/5">
                <span className="material-symbols-outlined mb-4 text-5xl text-slate-400">
                  description
                </span>
                <h3 className="text-lg font-bold">No documents yet</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Upload your first file above.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-primary/20 dark:bg-primary/5">
                <div className="border-b border-slate-200 px-6 py-4 dark:border-primary/20">
                  <h3 className="text-lg font-bold">Recent Documents</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-primary/10 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">Size</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-primary/20">
                      {docs.map((d) => (
                        <tr
                          key={d.id}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-primary/5"
                        >
                          <td className="px-6 py-4">
                            <Link
                              to={`/app/documents/${d.id}`}
                              className="flex items-center gap-3 font-medium text-primary hover:underline"
                            >
                              <span className="material-symbols-outlined text-primary">
                                {iconForFile(d.original_name)}
                              </span>
                              {d.original_name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {formatSize(d.file_size)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(d.status)}`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => onDelete(d.id)}
                              className="p-2 text-slate-400 transition-colors hover:text-rose-500"
                              aria-label="Delete"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
