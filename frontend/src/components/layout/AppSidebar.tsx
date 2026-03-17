import { NavLink } from 'react-router-dom'
import { useWorkspaces } from '../../workspaces/WorkspaceContext'

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary/5',
  ].join(' ')
}

export function AppSidebar() {
  const { state, setActiveWorkspaceId, create } = useWorkspaces()

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-primary/20 dark:bg-background-dark md:flex">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            DocuMind AI
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Document Q&A</p>
        </div>
      </div>

      <div className="px-4 pb-2">
        {state.status === 'ready' ? (
          <div className="flex items-center gap-2">
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5 dark:text-slate-200"
              value={state.activeWorkspaceId ?? ''}
              onChange={(e) => setActiveWorkspaceId(Number(e.target.value))}
            >
              {state.items.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-primary hover:text-primary dark:border-primary/20 dark:bg-background-dark dark:text-slate-300"
              aria-label="Create workspace"
              onClick={async () => {
                const name = window.prompt('Workspace name')
                if (!name) return
                await create(name)
              }}
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        ) : (
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-primary/10" />
        )}
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-4">
        <NavLink className={navClass} to="/app" end>
          <span className="material-symbols-outlined">dashboard</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink className={navClass} to="/app/documents">
          <span className="material-symbols-outlined">folder</span>
          <span>Documents</span>
        </NavLink>
        <NavLink className={navClass} to="/app/chat">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span>Chat</span>
        </NavLink>
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-primary/20">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>New Analysis</span>
        </button>
      </div>
    </aside>
  )
}

