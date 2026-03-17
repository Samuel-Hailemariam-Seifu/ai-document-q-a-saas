import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createWorkspace,
  listWorkspaces,
  type Workspace,
} from '../services/workspaces'
import { useAuth } from '../auth/AuthContext'

type WorkspaceState =
  | { status: 'loading' }
  | { status: 'ready'; items: Workspace[]; activeWorkspaceId: number | null }

type WorkspaceContextValue = {
  state: WorkspaceState
  refresh: () => Promise<void>
  setActiveWorkspaceId: (id: number) => void
  create: (name: string) => Promise<Workspace>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const ACTIVE_KEY = 'documind.activeWorkspaceId'

function readActiveId(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeActiveId(id: number) {
  localStorage.setItem(ACTIVE_KEY, String(id))
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth()
  const [state, setState] = useState<WorkspaceState>({ status: 'loading' })

  const refresh = useCallback(async () => {
    if (authState.status !== 'authenticated') {
      setState({ status: 'loading' })
      return
    }

    const items = await listWorkspaces()
    const preferred = readActiveId()
    const activeWorkspaceId =
      (preferred && items.some((w) => w.id === preferred) ? preferred : null) ??
      (items[0]?.id ?? null)

    if (activeWorkspaceId) writeActiveId(activeWorkspaceId)

    setState({ status: 'ready', items, activeWorkspaceId })
  }, [authState.status])

  const setActiveWorkspaceId = useCallback((id: number) => {
    writeActiveId(id)
    setState((prev) =>
      prev.status === 'ready' ? { ...prev, activeWorkspaceId: id } : prev,
    )
  }, [])

  const create = useCallback(async (name: string) => {
    const ws = await createWorkspace({ name })
    setState((prev) => {
      if (prev.status !== 'ready') return prev
      const items = [ws, ...prev.items]
      writeActiveId(ws.id)
      return { status: 'ready', items, activeWorkspaceId: ws.id }
    })
    return ws
  }, [])

  useEffect(() => {
    if (authState.status === 'authenticated') {
      void refresh()
    } else if (authState.status === 'anonymous') {
      setState({ status: 'loading' })
    }
  }, [authState.status, refresh])

  const value = useMemo<WorkspaceContextValue>(
    () => ({ state, refresh, setActiveWorkspaceId, create }),
    [state, refresh, setActiveWorkspaceId, create],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaces() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspaces must be used within WorkspaceProvider')
  return ctx
}

