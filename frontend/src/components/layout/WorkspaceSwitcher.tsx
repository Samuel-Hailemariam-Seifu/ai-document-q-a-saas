import { useCallback, useMemo, useState } from 'react'
import { Icon } from '../common/Icon'
import { useDismiss } from '../common/useDismiss'
import { useWorkspaces } from '../../workspaces/WorkspaceContext'

export function WorkspaceSwitcher() {
  const { state, setActiveWorkspaceId, create } = useWorkspaces()
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => setOpen(false), [])
  const menuRef = useDismiss(open, close)

  const activeName = useMemo(() => {
    if (state.status !== 'ready') return 'Workspace'
    return state.items.find((w) => w.id === state.activeWorkspaceId)?.name ?? 'Workspace'
  }, [state])

  const openModal = () => {
    setOpen(false)
    setName('')
    setError(null)
    setModalOpen(true)
  }

  const submit = async () => {
    const trimmed = name.trim()
    if (trimmed.length < 2 || creating) return
    setCreating(true)
    setError(null)
    try {
      await create(trimmed)
      setModalOpen(false)
      setName('')
    } catch {
      setError('Could not create the workspace. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (state.status !== 'ready') {
    return <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/10" />
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex h-9 max-w-[13rem] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-surface-dark dark:text-slate-200 dark:hover:bg-white/5"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Switch workspace"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary dark:text-primary-dark">
            <Icon name="workspaces" size={14} />
          </span>
          <span className="truncate">{activeName}</span>
          <Icon name="chevronDown" size={16} className="shrink-0 text-slate-400" />
        </button>

        {open ? (
          <div
            className="absolute left-0 top-11 z-40 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-surface-dark"
            role="menu"
          >
            <p className="saas-label px-2.5 py-1.5">Workspaces</p>
            <div className="custom-scrollbar max-h-64 overflow-y-auto">
              {state.items.map((w) => {
                const active = w.id === state.activeWorkspaceId
                return (
                  <button
                    key={w.id}
                    type="button"
                    role="menuitem"
                    className={[
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary dark:text-primary-dark'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5',
                    ].join(' ')}
                    onClick={() => {
                      setActiveWorkspaceId(w.id)
                      setOpen(false)
                    }}
                  >
                    <span className="truncate">{w.name}</span>
                    {active ? <Icon name="checkMark" size={16} className="shrink-0" /> : null}
                  </button>
                )
              })}
            </div>
            <div className="my-1.5 h-px bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              onClick={openModal}
            >
              <Icon name="plus" size={16} className="text-slate-400" />
              New workspace
            </button>
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Create workspace"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-surface-dark">
            <p className="saas-section-title">Create workspace</p>
            <p className="saas-meta mt-1">Workspaces keep documents and chats isolated.</p>

            <label htmlFor="workspace-name" className="saas-label mt-4 block">
              Workspace name
            </label>
            <input
              id="workspace-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., HR Policies"
              className="saas-input mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setModalOpen(false)
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void submit()
                }
              }}
            />
            {error ? <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="saas-btn saas-btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="saas-btn saas-btn-primary"
                disabled={creating || name.trim().length < 2}
                onClick={() => void submit()}
              >
                <Icon name={creating ? 'hourglass' : 'plus'} size={16} />
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
