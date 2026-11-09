import { useCallback, useMemo, useState } from 'react'
import { Icon } from '../common/Icon'
import { useDismiss } from '../common/useDismiss'
import { useWorkspaces } from '../../workspaces/WorkspaceContext'

/** Deterministic tile colour per workspace so switching feels tangible. */
const TILE_COLORS = [
  'from-teal-400 to-teal-600',
  'from-sky-400 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-fuchsia-400 to-purple-600',
  'from-emerald-400 to-green-600',
  'from-rose-400 to-pink-600',
]

function tileColor(rawId: string | number): string {
  const id = String(rawId)
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return TILE_COLORS[h % TILE_COLORS.length]
}

function WorkspaceTile({ id, name, size = 'md' }: { id: string | number; name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br font-semibold text-white shadow-soft',
        size === 'sm' ? 'size-5 text-[10px]' : 'size-6 text-[11px]',
        tileColor(id),
      ].join(' ')}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase() || 'W'}
    </span>
  )
}

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const { state, setActiveWorkspaceId, create } = useWorkspaces()
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => setOpen(false), [])
  const menuRef = useDismiss(open, close)

  const active = useMemo(() => {
    if (state.status !== 'ready') return null
    return state.items.find((w) => w.id === state.activeWorkspaceId) ?? null
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
    return <div className={['saas-skeleton h-10', compact ? 'w-10' : 'w-full'].join(' ')} />
  }

  const activeName = active?.name ?? 'Workspace'

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className={[
            'flex items-center gap-2 rounded-lg border border-subtle bg-surface-solid text-left shadow-soft transition-colors hover:border-strong',
            compact ? 'size-10 justify-center' : 'h-10 w-full px-2',
          ].join(' ')}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Workspace: ${activeName}. Switch workspace`}
          title={compact ? activeName : undefined}
        >
          <WorkspaceTile id={active?.id ?? 'w'} name={activeName} />
          {!compact ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-content">{activeName}</span>
              </span>
              <Icon name="chevronDown" size={14} className="shrink-0 text-content-muted" />
            </>
          ) : null}
        </button>

        {open ? (
          <div
            className={[
              'saas-menu absolute z-50 w-64 overflow-hidden rounded-xl p-1',
              compact ? 'left-0 top-12' : 'left-0 right-0 top-12 w-auto min-w-56',
            ].join(' ')}
            role="menu"
          >
            <p className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-content-muted">Workspaces</p>
            <div className="custom-scrollbar max-h-64 overflow-y-auto">
              {state.items.map((w) => {
                const isActive = w.id === state.activeWorkspaceId
                return (
                  <button
                    key={w.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={['saas-menu-item', isActive ? 'text-content' : ''].join(' ')}
                    onClick={() => {
                      setActiveWorkspaceId(w.id)
                      setOpen(false)
                    }}
                  >
                    <WorkspaceTile id={w.id} name={w.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{w.name}</span>
                    {isActive ? <Icon name="checkMark" size={15} className="shrink-0 text-accent-text" /> : null}
                  </button>
                )
              })}
            </div>
            <div className="saas-divider my-1" />
            <button type="button" role="menuitem" className="saas-menu-item" onClick={openModal}>
              <span className="flex size-5 items-center justify-center rounded-md border border-dashed border-strong text-content-muted">
                <Icon name="plus" size={12} />
              </span>
              New workspace
            </button>
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <div
          className="saas-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Create workspace"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="saas-dialog max-w-md">
            <div className="saas-icon-tile-accent mb-4">
              <Icon name="workspaces" size={18} />
            </div>
            <p className="text-lg font-semibold tracking-tight text-content">Create a workspace</p>
            <p className="saas-subtitle">Workspaces keep documents, chats and billing separate — one per team or project.</p>

            <label htmlFor="workspace-name" className="saas-field-label mt-5">
              Workspace name
            </label>
            <input
              id="workspace-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HR Policies"
              className="saas-input"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setModalOpen(false)
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void submit()
                }
              }}
            />
            {error ? <p className="mt-2 text-xs font-medium text-danger">{error}</p> : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                {creating ? 'Creating…' : 'Create workspace'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
