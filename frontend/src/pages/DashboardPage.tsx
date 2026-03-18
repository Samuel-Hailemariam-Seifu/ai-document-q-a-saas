import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDocuments, type DocumentListItem } from '../services/documents'
import { useWorkspaces } from '../workspaces/WorkspaceContext'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusClass(status: string): string {
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

export function DashboardPage() {
  const { state } = useWorkspaces()
  const [recentDocs, setRecentDocs] = useState<DocumentListItem[]>([])

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

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshDocs()
    }, 0)
    return () => window.clearTimeout(t)
  }, [refreshDocs])
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            label: 'Total Documents',
            value: '1,284',
            icon: 'description',
            sub: '+12.5% from last month',
          },
          { label: 'AI Queries', value: '42.5k', icon: 'bolt', sub: '+24.2% from last month' },
          { label: 'Storage Used', value: '84%', icon: 'cloud', sub: null },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                <h3 className="mt-1 text-3xl font-bold">{s.value}</h3>
              </div>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
            </div>
            {s.sub ? (
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-500">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                <span>{s.sub}</span>
              </div>
            ) : (
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full w-[84%] bg-primary" />
              </div>
            )}
          </div>
        ))}
      </div>

      <Link
        className="flex flex-col items-center space-y-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition-colors hover:border-primary/40 dark:border-primary/30 dark:bg-primary/5 dark:hover:border-primary/50"
        to="/app/documents"
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-3xl">upload_file</span>
        </div>
        <div>
          <h4 className="text-lg font-bold">Upload new documents</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag and drop your PDF, DOCX or TXT files here
          </p>
        </div>
        <span className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-white transition-all hover:bg-primary/90">
          Browse Files
        </span>
        <p className="text-xs text-slate-400">Maximum file size: 25MB per document</p>
      </Link>

      <Link
        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-primary/30 dark:border-primary/20 dark:bg-primary/5"
        to="/app/chat"
      >
        <div>
          <h4 className="text-lg font-bold">Ask DocuMind AI</h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Chat with your workspace documents with citations.
          </p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
        </div>
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-primary/20 dark:bg-primary/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-primary/20">
          <h3 className="text-lg font-bold">Recent Documents</h3>
          <Link className="text-sm font-semibold text-primary hover:underline" to="/app/documents">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-primary/10 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Document Name</th>
                <th className="px-6 py-4 font-semibold">Date Added</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-primary/20">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    No documents yet.{' '}
                    <Link to="/app/documents" className="text-primary hover:underline">
                      Upload one
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                recentDocs.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-primary/5">
                    <td className="px-6 py-4">
                      <Link
                        to={`/app/documents/${d.id}`}
                        className="flex items-center gap-3 font-medium text-slate-900 hover:text-primary dark:text-white"
                      >
                        <span className="material-symbols-outlined text-primary">
                          {d.original_name.toLowerCase().endsWith('.pdf')
                            ? 'picture_as_pdf'
                            : d.original_name.toLowerCase().endsWith('.docx')
                              ? 'description'
                              : 'article'}
                        </span>
                        <div>
                          <p className="font-medium">{d.original_name}</p>
                          <p className="text-xs text-slate-500">{formatSize(d.file_size)}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/app/documents/${d.id}`}
                        className="p-2 text-slate-400 transition-colors hover:text-primary"
                        aria-label="View"
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

