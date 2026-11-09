import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  askQuestion,
  createChat,
  deleteChat,
  listChats,
  listMessages,
  type Chat,
  type Citation,
  type Message,
} from '../services/chat'
import { listDocuments, uploadDocument, type DocumentListItem } from '../services/documents'
import { atQuestionLimit, getUsageSnapshot, type UsageSnapshot } from '../services/usage'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { AssistantMessage } from '../components/chat/AssistantMessage'
import { CitationViewer } from '../components/chat/CitationViewer'
import { SourcesPanel } from '../components/chat/SourcesPanel'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { DisabledHint } from '../components/common/DisabledHint'
import { Icon, type IconName } from '../components/common/Icon'
import { LogoMark } from '../components/brand/LogoMark'
import { dedupeCitations } from '../lib/citations'
import { PRODUCT_NAME } from '../lib/brand'
import { formatDate, formatDateTime, formatNumber, formatRelativeTime } from '../lib/format'

const CHAT_DOC_SELECTION_KEY = 'documind.chat.selectedDocumentIds'
const CHAT_UI_PREFS_KEY = 'documind.chat.uiPrefs'

function readChatUiPrefs(): { left: boolean; right: boolean } {
  try {
    const raw = localStorage.getItem(CHAT_UI_PREFS_KEY)
    if (!raw) return { left: true, right: true }
    const parsed = JSON.parse(raw) as { left?: unknown; right?: unknown }
    return { left: parsed.left !== false, right: parsed.right !== false }
  } catch {
    return { left: true, right: true }
  }
}

function writeChatUiPrefs(prefs: { left: boolean; right: boolean }) {
  try {
    localStorage.setItem(CHAT_UI_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

function parseDocumentIds(value: string | null): number[] {
  if (!value) return []
  const ids = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isFinite(id) && id > 0)
  return Array.from(new Set(ids))
}

function readStoredDocumentIds(workspaceId: number): number[] {
  try {
    const raw = localStorage.getItem(`${CHAT_DOC_SELECTION_KEY}.${workspaceId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
  } catch {
    return []
  }
}

function writeStoredDocumentIds(workspaceId: number, documentIds: number[]) {
  try {
    localStorage.setItem(`${CHAT_DOC_SELECTION_KEY}.${workspaceId}`, JSON.stringify(documentIds))
  } catch {
    // ignore
  }
}

function sameIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

function startOfDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function chatGroupLabel(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Earlier'
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'Previous 7 days'
  return formatDate(iso)
}

function groupChatsByDate(chats: Chat[]): Array<{ label: string; items: Chat[] }> {
  const map = new Map<string, Chat[]>()
  for (const c of chats) {
    const label = chatGroupLabel(c.created_at)
    const list = map.get(label) ?? []
    list.push(c)
    map.set(label, list)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

function buildDocSuggestions(docs: DocumentListItem[]): string[] {
  const names = docs.slice(0, 3).map((d) => d.original_name.replace(/\.[^.]+$/, ''))
  if (names.length === 0) {
    return [
      'Summarize the key points from my uploaded documents.',
      'List important deadlines or dates mentioned in the files.',
      'What policies or requirements should I know about?',
    ]
  }
  const [a, b] = names
  return [
    `Summarize the main points in ${a}.`,
    `What requirements or rules are defined in ${a}?`,
    b ? `Compare key ideas between ${a} and ${b}.` : `List important dates or deadlines in ${a}.`,
    `What should I verify with citations from ${a}?`,
  ].slice(0, 4)
}

export function ChatPage() {
  const { state: wsState } = useWorkspaces()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeWorkspaceId = wsState.status === 'ready' ? wsState.activeWorkspaceId : null
  const activeChatId = searchParams.get('chatId') ? Number(searchParams.get('chatId')) : null
  const searchDocIds = useMemo(() => parseDocumentIds(searchParams.get('docIds')), [searchParams])
  const pendingQuestion = searchParams.get('q')

  const [uiPrefs, setUiPrefs] = useState<{ left: boolean; right: boolean }>(() => readChatUiPrefs())
  const [mobileChatsOpen, setMobileChatsOpen] = useState(false)
  const [mobileSourcesOpen, setMobileSourcesOpen] = useState(false)

  const [draft, setDraft] = useState('')
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [citations, setCitations] = useState<Citation[]>([])
  const [readyDocuments, setReadyDocuments] = useState<DocumentListItem[]>([])
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([])
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [attachmentOpen, setAttachmentOpen] = useState(false)
  const [failedTurn, setFailedTurn] = useState<{ localId: number; content: string; error: string } | null>(
    null,
  )
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<number | null>(null)
  const [newChatModalOpen, setNewChatModalOpen] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [creatingNewChat, setCreatingNewChat] = useState(false)
  const [activeCitationNumber, setActiveCitationNumber] = useState<number | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [renameChatId, setRenameChatId] = useState<number | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [usage, setUsage] = useState<UsageSnapshot | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const draftRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const numberedCitations = useMemo(() => dedupeCitations(citations), [citations])
  const suggestions = useMemo(() => buildDocSuggestions(readyDocuments), [readyDocuments])

  const updateSearchParams = useCallback(
    (updates: { chatId?: number | null; documentIds?: number[] | null }) => {
      const next = new URLSearchParams(searchParams)
      if (updates.chatId !== undefined) {
        if (updates.chatId == null) next.delete('chatId')
        else next.set('chatId', String(updates.chatId))
      }
      if (updates.documentIds !== undefined) {
        if (!updates.documentIds || updates.documentIds.length === 0) next.delete('docIds')
        else next.set('docIds', updates.documentIds.join(','))
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const refreshUsage = useCallback(async () => {
    if (!activeWorkspaceId) {
      setUsage(null)
      return
    }
    try {
      setUsage(await getUsageSnapshot(activeWorkspaceId))
    } catch {
      setUsage(null)
    }
  }, [activeWorkspaceId])

  useEffect(() => {
    void refreshUsage()
  }, [refreshUsage])

  const refreshReadyDocuments = useCallback(async () => {
    if (!activeWorkspaceId) {
      setReadyDocuments([])
      return
    }
    try {
      const docs = await listDocuments(activeWorkspaceId)
      setReadyDocuments(docs.filter((doc) => doc.status === 'ready'))
    } catch {
      setReadyDocuments([])
    }
  }, [activeWorkspaceId])

  const refreshChats = useCallback(async () => {
    if (!activeWorkspaceId) return
    const list = await listChats(activeWorkspaceId)
    setChats(list)
    if (!activeChatId && list[0]) {
      updateSearchParams({ chatId: list[0].id })
    }
  }, [activeWorkspaceId, activeChatId, updateSearchParams])

  const refreshMessages = useCallback(async () => {
    if (!activeWorkspaceId || !activeChatId) {
      setMessages([])
      setCitations([])
      setFailedTurn(null)
      return
    }
    const list = await listMessages(activeChatId, activeWorkspaceId)
    setMessages(list)
    setFailedTurn(null)
    const lastAssistant = [...list].reverse().find((m) => m.role === 'assistant')
    setCitations(lastAssistant?.citations ?? [])
  }, [activeWorkspaceId, activeChatId])

  useEffect(() => {
    void refreshChats()
  }, [refreshChats])

  useEffect(() => {
    void refreshMessages()
  }, [refreshMessages])

  useEffect(() => {
    void refreshReadyDocuments()
  }, [refreshReadyDocuments])

  useEffect(() => {
    if (!activeWorkspaceId) {
      setSelectedDocumentIds([])
      return
    }

    const readyIds = readyDocuments.map((doc) => doc.id)
    if (readyIds.length === 0) {
      if (selectedDocumentIds.length > 0) setSelectedDocumentIds([])
      return
    }

    const allowed = new Set(readyIds)
    const fromUrl = searchDocIds.filter((id) => allowed.has(id))
    const fromStorage = readStoredDocumentIds(activeWorkspaceId).filter((id) => allowed.has(id))
    const nextIds = fromUrl.length > 0 ? fromUrl : fromStorage.length > 0 ? fromStorage : readyIds

    if (!sameIds(selectedDocumentIds, nextIds)) {
      setSelectedDocumentIds(nextIds)
    }
    writeStoredDocumentIds(activeWorkspaceId, nextIds)
    if (!sameIds(fromUrl, nextIds)) {
      updateSearchParams({ documentIds: nextIds })
    }
  }, [activeWorkspaceId, readyDocuments, searchDocIds, selectedDocumentIds, updateSearchParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    const el = draftRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft])

  const activeChatTitle = useMemo(() => {
    return chats.find((c) => c.id === activeChatId)?.title ?? 'Assistant'
  }, [chats, activeChatId])

  const selectedDocuments = useMemo(
    () => readyDocuments.filter((doc) => selectedDocumentIds.includes(doc.id)),
    [readyDocuments, selectedDocumentIds],
  )

  const chatGroups = useMemo(() => groupChatsByDate(chats), [chats])

  const lastUserContent = useMemo(() => {
    return [...messages].reverse().find((m) => m.role === 'user')?.content ?? null
  }, [messages])

  const createNewChat = useCallback(() => {
    if (!activeWorkspaceId) return
    setNewChatTitle('')
    setNewChatModalOpen(true)
  }, [activeWorkspaceId])

  const submitCreateNewChat = useCallback(async () => {
    if (!activeWorkspaceId || creatingNewChat) return
    const title = newChatTitle.trim()
    if (!title) return
    setCreatingNewChat(true)
    try {
      const created = await createChat(activeWorkspaceId, title)
      setChats((prev) => [created, ...prev])
      updateSearchParams({ chatId: created.id })
      setNewChatModalOpen(false)
      setNewChatTitle('')
    } finally {
      setCreatingNewChat(false)
    }
  }, [activeWorkspaceId, creatingNewChat, newChatTitle, updateSearchParams])

  const onDeleteChat = useCallback(
    async (chatId: number) => {
      if (!activeWorkspaceId) return
      try {
        await deleteChat(chatId, activeWorkspaceId)
        const list = await listChats(activeWorkspaceId)
        setChats(list)
        if (activeChatId === chatId) {
          if (list[0]) {
            updateSearchParams({ chatId: list[0].id })
          } else {
            updateSearchParams({ chatId: null })
            setMessages([])
            setCitations([])
          }
        }
      } catch {
        // ignore
      }
    },
    [activeWorkspaceId, activeChatId, updateSearchParams],
  )

  const pendingDeleteChatTitle = useMemo(() => {
    if (pendingDeleteChatId == null) return null
    return chats.find((c) => c.id === pendingDeleteChatId)?.title ?? 'this chat'
  }, [pendingDeleteChatId, chats])

  async function onFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !activeWorkspaceId) return
    setUploadMessage(null)
    setUploading(true)
    try {
      await uploadDocument(activeWorkspaceId, file)
      setUploadMessage({ type: 'success', text: `"${file.name}" uploaded. It will be processed shortly.` })
      setTimeout(() => setUploadMessage(null), 5000)
      await refreshReadyDocuments()
    } catch (err) {
      setUploadMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const updateDocumentSelection = useCallback(
    (nextIds: number[]) => {
      const sorted = [...nextIds].sort((a, b) => a - b)
      setSelectedDocumentIds(sorted)
      if (activeWorkspaceId) writeStoredDocumentIds(activeWorkspaceId, sorted)
      updateSearchParams({ documentIds: sorted })
    },
    [activeWorkspaceId, updateSearchParams],
  )

  const toggleDocumentSelection = useCallback(
    (documentId: number) => {
      const exists = selectedDocumentIds.includes(documentId)
      const next = exists
        ? selectedDocumentIds.filter((id) => id !== documentId)
        : [...selectedDocumentIds, documentId]
      updateDocumentSelection(next)
    },
    [selectedDocumentIds, updateDocumentSelection],
  )

  const questionsAtLimit = usage ? atQuestionLimit(usage) : false

  const sendQuestion = useCallback(
    async (question: string, opts?: { retryLocalId?: number; omitUserBubble?: boolean }) => {
      if (!question.trim()) return
      if (!activeWorkspaceId) return
      if (usage && atQuestionLimit(usage)) {
        setFailedTurn({
          localId: Date.now(),
          content: question.trim(),
          error: `Question limit reached (${formatNumber(usage.questionsUsed)} / ${formatNumber(usage.questionsLimit)}). Upgrade to continue.`,
        })
        return
      }
      const cleaned = question.trim()
      const localId = opts?.retryLocalId ?? Date.now()

      if (!opts?.retryLocalId && !opts?.omitUserBubble) {
        setDraft('')
        setMessages((prev) => [
          ...prev,
          {
            id: localId,
            chat_id: activeChatId ?? 0,
            role: 'user',
            content: cleaned,
            created_at: new Date().toISOString(),
          } as Message,
        ])
      }

      setSending(true)
      setFailedTurn(null)
      try {
        let chatId = activeChatId
        if (!chatId) {
          const created = await createChat(activeWorkspaceId, cleaned.slice(0, 60))
          chatId = created.id
          setChats((prev) => [created, ...prev])
          setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, chat_id: chatId! } : m)))
          updateSearchParams({ chatId })
        }

        const res = await askQuestion(activeWorkspaceId, cleaned, chatId, selectedDocumentIds)
        const nextCitations = res.citations ?? []
        setCitations(nextCitations)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            chat_id: res.chat_id,
            role: 'assistant',
            content:
              nextCitations.length === 0
                ? res.answer ||
                  'No matching passages were retrieved for this question.'
                : res.answer,
            citations: nextCitations,
            created_at: new Date().toISOString(),
          } as Message,
        ])
        await refreshChats()
        void refreshUsage()
      } catch (error) {
        const message =
          (error as { message?: string } | null)?.message ||
          'The assistant could not answer right now. Please try again.'
        setFailedTurn({ localId, content: cleaned, error: message })
      } finally {
        setSending(false)
      }
    },
    [activeWorkspaceId, activeChatId, refreshChats, refreshUsage, selectedDocumentIds, updateSearchParams, usage],
  )

  // Dashboard "Ask a question" deep-link: /app/chat?q=...
  useEffect(() => {
    if (!pendingQuestion || !activeWorkspaceId || sending) return
    const q = pendingQuestion.trim()
    if (!q) return
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    setSearchParams(next, { replace: true })
    void sendQuestion(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once when q arrives
  }, [pendingQuestion, activeWorkspaceId, sendQuestion])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    await sendQuestion(draft)
  }

  function onDraftKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!sending && draft.trim()) void sendQuestion(draft)
    }
  }

  const setPanel = (panel: 'left' | 'right', visible: boolean) => {
    const next = { ...uiPrefs, [panel]: visible }
    setUiPrefs(next)
    writeChatUiPrefs(next)
  }

  /** Header toggles: dock/undock on wide screens, open the drawer/sheet on small ones. */
  const toggleChatsPanel = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) setPanel('left', !uiPrefs.left)
    else setMobileChatsOpen(true)
  }

  const toggleSourcesPanel = () => {
    if (window.matchMedia('(min-width: 1280px)').matches) setPanel('right', !uiPrefs.right)
    else setMobileSourcesOpen(true)
  }

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleChatsPanel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const openCitation = useCallback(
    (number: number) => {
      const idx = numberedCitations.findIndex((c) => c.number === number)
      if (idx < 0) return
      setViewerIndex(idx)
      setViewerOpen(true)
      setActiveCitationNumber(number)
      setMobileSourcesOpen(true)
      window.requestAnimationFrame(() => {
        document.getElementById(`source-${number}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    },
    [numberedCitations],
  )

  const applyRenameLocal = () => {
    if (renameChatId == null) return
    const title = renameTitle.trim()
    if (title.length < 2) return
    // Persist requires PATCH /api/chats/{id} (not approved yet) — update session UI only.
    setChats((prev) => prev.map((c) => (c.id === renameChatId ? { ...c, title } : c)))
    setRenameChatId(null)
    setRenameTitle('')
  }

  const chatList = (onNavigate?: () => void) =>
    chats.length === 0 ? (
      <div className="px-3 py-8 text-center">
        <p className="text-ui-sm text-content-faint">No chats yet</p>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        {chatGroups.map((group) => (
          <div key={group.label}>
            <p className="flex h-7 items-center px-2.5 text-xs font-medium text-content-muted">{group.label}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((c) => {
                const active = activeChatId === c.id
                return (
                  <div key={c.id} className="group relative flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams({ chatId: String(c.id) }, { replace: true })
                        onNavigate?.()
                      }}
                      className={[
                        'saas-nav-item min-w-0 flex-1 pr-16 text-left font-normal group-hover:pr-16',
                        active ? 'saas-nav-item-active font-medium' : '',
                      ].join(' ')}
                    >
                      <span className="truncate">{c.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenameChatId(c.id)
                        setRenameTitle(c.title)
                      }}
                      className="absolute right-8 inline-flex size-7 items-center justify-center rounded-md text-content-muted opacity-0 transition-opacity hover:bg-surface-hover hover:text-content focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label={`Rename chat ${c.title}`}
                      title="Rename (session only until API exists)"
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteChatId(c.id)}
                      className="absolute right-1 inline-flex size-7 items-center justify-center rounded-md text-content-muted opacity-0 transition-opacity hover:bg-surface-hover hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label={`Delete chat ${c.title}`}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )

  const sourcesBody = (
    <SourcesPanel
      citations={numberedCitations}
      activeNumber={activeCitationNumber}
      onHoverNumber={setActiveCitationNumber}
      onOpenCitation={openCitation}
    />
  )

  const sendDisabled = sending || !draft.trim() || questionsAtLimit
  const sendReason = !activeWorkspaceId
    ? 'Select a workspace first.'
    : questionsAtLimit
      ? 'Question limit reached. Upgrade to continue.'
      : sending
        ? 'Waiting for the assistant…'
        : !draft.trim()
          ? 'Type a question to send.'
          : ''

  return (
    <div className="app-canvas flex h-[100dvh] text-content lg:py-2 lg:pr-2">
      {/* Left rail: collapses to icons instead of disappearing */}
      <aside
        className={[
          'hidden shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out lg:flex',
          uiPrefs.left ? 'w-64' : 'w-[60px]',
        ].join(' ')}
        aria-label="Chat navigation"
      >
        <div className="flex h-12 shrink-0 items-center px-[18px] pt-1">
          <Link
            to="/app"
            className="flex min-w-0 items-center gap-2"
            aria-label="Go to Overview"
            title={uiPrefs.left ? undefined : 'Overview'}
          >
            <LogoMark size={24} className="shrink-0" />
            <span
              className={[
                'truncate whitespace-nowrap text-[0.9375rem] font-semibold tracking-[-0.02em] text-content transition-opacity duration-150',
                uiPrefs.left ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              {PRODUCT_NAME}
            </span>
          </Link>
        </div>

        <div className="flex flex-col gap-0.5 px-3 pt-3">
          <RailItem
            expanded={uiPrefs.left}
            icon="plus"
            label="New chat"
            onClick={createNewChat}
            disabled={!activeWorkspaceId}
            emphasis
          />
          <RailItem expanded={uiPrefs.left} icon="dashboard" label="Overview" to="/app" />
          <RailItem expanded={uiPrefs.left} icon="folder" label="Documents" to="/app/documents" />
        </div>

        {uiPrefs.left ? (
          <nav className="custom-scrollbar mt-5 min-h-0 flex-1 animate-fade-in overflow-y-auto px-3 pb-3">
            {chatList()}
          </nav>
        ) : (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              className="saas-icon-btn size-9"
              onClick={() => setPanel('left', true)}
              aria-label="Show chat history"
              title="Chat history (Ctrl+B)"
            >
              <Icon name="history" size={16} />
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-solid lg:rounded-xl lg:border lg:border-subtle lg:shadow-raised">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-subtle px-2.5 md:px-3">
          <button
            type="button"
            className="saas-icon-btn size-8"
            onClick={toggleChatsPanel}
            aria-label={uiPrefs.left ? 'Collapse chats panel' : 'Expand chats panel'}
            title={`${uiPrefs.left ? 'Collapse' : 'Expand'} chats (Ctrl+B)`}
          >
            <Icon name="panelLeft" size={16} />
          </button>
          <span className="h-4 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 pl-1 text-sm">
            <Link
              to="/app"
              className="hidden shrink-0 text-content-muted transition-colors hover:text-content sm:inline"
            >
              Overview
            </Link>
            <span className="hidden text-content-faint sm:inline">/</span>
            <span className="hidden shrink-0 text-content-muted md:inline">Assistant</span>
            <span className="hidden text-content-faint md:inline">/</span>
            <span className="truncate font-medium text-content" aria-current="page">
              {activeChatTitle}
            </span>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className="saas-icon-btn size-8 lg:hidden"
              onClick={createNewChat}
              disabled={!activeWorkspaceId}
              aria-label="New chat"
              title="New chat"
            >
              <Icon name="plus" size={16} />
            </button>
            <button
              type="button"
              onClick={toggleSourcesPanel}
              aria-pressed={uiPrefs.right}
              aria-label={`${uiPrefs.right ? 'Hide' : 'Show'} sources (${numberedCitations.length})`}
              title={uiPrefs.right ? 'Hide sources' : 'Show sources'}
              className={[
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-ui-sm font-medium transition-colors',
                uiPrefs.right
                  ? 'border-subtle text-content-secondary hover:text-content xl:border-strong xl:bg-surface-muted xl:text-content'
                  : 'border-subtle text-content-secondary hover:border-strong hover:text-content',
              ].join(' ')}
            >
              <Icon name="book" size={14} />
              <span className="hidden sm:inline">Sources</span>
              <span
                className={[
                  'tabular min-w-5 rounded-full px-1.5 text-center text-xs',
                  numberedCitations.length ? 'bg-accent-soft text-accent-text' : 'bg-surface-muted text-content-muted',
                ].join(' ')}
              >
                {numberedCitations.length}
              </span>
            </button>
          </div>
        </header>

      <div className="flex min-h-0 flex-1">

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8">
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-7">
              {messages.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center py-10 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 text-white shadow-raised">
                    <Icon name="sparkles" size={22} />
                  </span>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-content">What do you want to know?</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-content-muted">
                    Ask in plain language. Every answer links back to the exact passage it came from.
                  </p>
                  <div className="mx-auto mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                    {suggestions.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="group flex items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-solid px-4 py-3 text-left text-ui-sm text-content-secondary shadow-soft transition-colors hover:border-strong hover:text-content"
                        onClick={() => {
                          setDraft(prompt)
                          void sendQuestion(prompt)
                        }}
                      >
                        <span>{prompt}</span>
                        <Icon
                          name="chevronRight"
                          size={14}
                          className="shrink-0 text-content-muted transition-colors group-hover:text-accent"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isLastAssistant =
                    m.role === 'assistant' && !messages.slice(idx + 1).some((x) => x.role === 'assistant')
                  if (m.role === 'assistant') {
                    const msgCitations = dedupeCitations(m.citations ?? (isLastAssistant ? citations : []))
                    const emptyRetrieval = (m.citations?.length ?? (isLastAssistant ? citations.length : 1)) === 0
                    return (
                      <AssistantMessage
                        key={m.id}
                        content={m.content}
                        createdAt={m.created_at}
                        citations={msgCitations}
                        emptyRetrieval={emptyRetrieval}
                        searchedDocNames={selectedDocuments.map((d) => d.original_name)}
                        activeNumber={isLastAssistant ? activeCitationNumber : null}
                        onHoverNumber={setActiveCitationNumber}
                        onOpenCitation={openCitation}
                        canRegenerate={isLastAssistant && Boolean(lastUserContent) && !sending}
                        onRegenerate={
                          lastUserContent
                            ? () => {
                                void sendQuestion(lastUserContent, { omitUserBubble: true })
                              }
                            : undefined
                        }
                      />
                    )
                  }
                  return (
                    <div key={m.id} className="group flex flex-col items-end">
                      <div className="max-w-[min(85%,32rem)] whitespace-pre-wrap rounded-2xl rounded-br-md bg-surface-inverse px-4 py-2.5 text-sm leading-relaxed text-content-inverse shadow-soft">
                        {m.content}
                      </div>
                      <p
                        className="mt-1.5 text-2xs tabular-nums text-content-faint opacity-0 transition-opacity group-hover:opacity-100"
                        title={formatDateTime(m.created_at)}
                      >
                        {formatRelativeTime(m.created_at)}
                      </p>
                      {failedTurn?.localId === m.id ? (
                        <div className="mt-2 w-full max-w-[min(85%,28rem)] rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                          <div className="flex items-start gap-2">
                            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">Couldn’t send this message</p>
                              <p className="mt-1 text-content-secondary dark:text-rose-100/80">{failedTurn.error}</p>
                              <button
                                type="button"
                                className="saas-btn saas-btn-secondary mt-3 h-9 min-h-9"
                                disabled={sending}
                                onClick={() =>
                                  void sendQuestion(failedTurn.content, { retryLocalId: failedTurn.localId })
                                }
                              >
                                <Icon name="refresh" size={14} />
                                Retry
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}

              {sending ? (
                <div className="flex gap-3" aria-live="polite">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 text-white">
                    <Icon name="sparkles" size={14} className="animate-pulse" />
                  </span>
                  <div className="flex items-center gap-2 py-1.5 text-sm text-content-muted">
                    <span className="inline-flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-content-muted [animation-delay:-0.2s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-content-muted [animation-delay:-0.1s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-content-muted" />
                    </span>
                    Thinking…
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div
            className="shrink-0 bg-surface-solid px-4 pb-3 pt-1 md:px-8"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="relative mx-auto w-full max-w-[760px]">
              {uploadMessage ? (
                <div
                  className={[
                    'mb-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
                    uploadMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                  ].join(' ')}
                >
                  <Icon
                    name={uploadMessage.type === 'error' ? 'alert' : 'check'}
                    size={14}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{uploadMessage.text}</span>
                </div>
              ) : null}

              {attachmentOpen ? (
                <div className="saas-menu absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-content-muted">Search these documents</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-xs font-medium text-content-muted hover:underline disabled:opacity-50"
                        onClick={() => updateDocumentSelection([])}
                        disabled={selectedDocumentIds.length === 0}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
                        onClick={() => updateDocumentSelection(readyDocuments.map((doc) => doc.id))}
                        disabled={readyDocuments.length === 0}
                      >
                        Select all
                      </button>
                    </div>
                  </div>
                  {readyDocuments.length === 0 ? (
                    <p className="text-xs text-content-muted">
                      No ready documents yet. Upload a file and wait for ingestion.
                    </p>
                  ) : (
                    <div className="custom-scrollbar max-h-52 overflow-y-auto pr-1">
                      {readyDocuments.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-ui-sm text-content-secondary transition-colors hover:bg-surface-muted"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(doc.id)}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            className="size-3.5 rounded border-subtle text-primary focus:ring-primary"
                          />
                          <span className="truncate">{doc.original_name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {questionsAtLimit && usage ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  <span className="flex items-start gap-2">
                    <Icon name="crown" size={16} className="mt-0.5 shrink-0" />
                    Question limit reached ({formatNumber(usage.questionsUsed)} /{' '}
                    {formatNumber(usage.questionsLimit)}). Upgrade to keep asking.
                  </span>
                  <Link to="/app/billing" className="saas-btn saas-btn-secondary">
                    Upgrade
                  </Link>
                </div>
              ) : null}

              <form
                className="rounded-2xl border border-strong bg-surface-solid shadow-raised transition-[border-color,box-shadow] focus-within:border-[var(--accent)] focus-within:ring-[3px] focus-within:ring-[color-mix(in_srgb,var(--accent)_15%,transparent)]"
                onSubmit={onSubmit}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={onFileSelect}
                  disabled={!activeWorkspaceId || uploading}
                />

                <textarea
                  ref={draftRef}
                  className="max-h-40 min-h-12 w-full resize-none border-0 bg-transparent px-4 pb-1 pt-3.5 text-[0.9375rem] text-content outline-none placeholder:text-content-faint focus:ring-0"
                  placeholder={
                    questionsAtLimit
                      ? 'Question limit reached — upgrade to continue…'
                      : 'Ask a question about your documents…'
                  }
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onDraftKeyDown}
                  disabled={questionsAtLimit}
                />

                <div className="flex items-center gap-1 px-2 pb-2">
                  <DisabledHint
                    disabled={!activeWorkspaceId || uploading}
                    reason={!activeWorkspaceId ? 'Select a workspace first.' : 'Upload in progress…'}
                  >
                    <button
                      type="button"
                      className="saas-icon-btn size-8"
                      aria-label="Upload a document"
                      title="Upload a document"
                      disabled={!activeWorkspaceId || uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon name={uploading ? 'hourglass' : 'paperclip'} size={16} />
                    </button>
                  </DisabledHint>

                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-subtle px-2.5 text-xs font-medium text-content-secondary transition-colors hover:border-strong hover:text-content"
                    onClick={() => setAttachmentOpen((open) => !open)}
                    aria-expanded={attachmentOpen}
                  >
                    <Icon name="folder" size={14} />
                    {selectedDocuments.length === 0
                      ? 'No sources'
                      : `${selectedDocuments.length} source${selectedDocuments.length === 1 ? '' : 's'}`}
                  </button>

                  <DisabledHint disabled={sendDisabled} reason={sendReason} className="ml-auto">
                    <button
                      type="submit"
                      className="saas-btn saas-btn-primary size-8 rounded-full px-0"
                      aria-label="Send"
                      disabled={sendDisabled}
                      title={sendDisabled ? sendReason : 'Send'}
                    >
                      <Icon name={sending ? 'hourglass' : 'arrowUp'} size={15} />
                    </button>
                  </DisabledHint>
                </div>
              </form>

              <p className="mt-2 text-center text-2xs text-content-faint">
                {PRODUCT_NAME} can make mistakes. Verify important information against the sources.
              </p>
            </div>
          </div>
        </section>

        <aside
          className={[
            'hidden shrink-0 overflow-hidden border-l bg-surface-muted/40 transition-[width,border-color] duration-200 ease-out xl:block',
            uiPrefs.right ? 'w-80 border-subtle' : 'w-0 border-transparent',
          ].join(' ')}
          aria-label="Sources"
          aria-hidden={!uiPrefs.right}
          inert={!uiPrefs.right}
        >
          <div className="flex h-full w-80 flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between gap-2 pl-4 pr-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-content">Sources</p>
                <span className="saas-badge saas-badge-neutral tabular">{numberedCitations.length}</span>
              </div>
              <button
                type="button"
                className="saas-icon-btn size-8"
                onClick={() => setPanel('right', false)}
                aria-label="Close sources"
                title="Close"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4">{sourcesBody}</div>
          </div>
        </aside>
      </div>
      </div>

      {mobileChatsOpen ? (
        <div
          className="fixed inset-0 z-50 animate-fade-in bg-zinc-950/50 backdrop-blur-[2px] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Chats"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileChatsOpen(false)
          }}
        >
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] animate-pop-in flex-col border-r border-subtle bg-surface-canvas shadow-overlay">
            <div className="flex h-14 items-center justify-between px-4">
              <Link to="/app" className="flex items-center gap-2" aria-label="Go to Overview">
                <LogoMark size={24} className="shrink-0" />
                <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-content">{PRODUCT_NAME}</span>
              </Link>
              <button
                type="button"
                className="saas-icon-btn"
                onClick={() => setMobileChatsOpen(false)}
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-0.5 border-b border-subtle px-3 pb-3">
              <RailItem
                expanded
                icon="plus"
                label="New chat"
                emphasis
                disabled={!activeWorkspaceId}
                onClick={() => {
                  setMobileChatsOpen(false)
                  createNewChat()
                }}
              />
              <RailItem expanded icon="dashboard" label="Overview" to="/app" />
              <RailItem expanded icon="folder" label="Documents" to="/app/documents" />
            </div>
            <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3">
              {chatList(() => setMobileChatsOpen(false))}
            </nav>
          </div>
        </div>
      ) : null}

      {mobileSourcesOpen ? (
        <div
          className="fixed inset-0 z-50 animate-fade-in bg-zinc-950/50 backdrop-blur-[2px] xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Sources"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileSourcesOpen(false)
          }}
        >
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] animate-pop-in rounded-t-2xl border border-subtle bg-surface-solid shadow-overlay">
            <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="saas-section-title">Sources</p>
                <span className="saas-badge saas-badge-neutral tabular">{numberedCitations.length}</span>
              </div>
              <button
                type="button"
                className="saas-icon-btn"
                onClick={() => setMobileSourcesOpen(false)}
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="custom-scrollbar max-h-[calc(85dvh-56px)] overflow-y-auto p-4">{sourcesBody}</div>
          </div>
        </div>
      ) : null}

      <CitationViewer
        open={viewerOpen}
        citations={numberedCitations}
        index={viewerIndex}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />

      {newChatModalOpen ? (
        <div
          className="saas-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Create chat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setNewChatModalOpen(false)
          }}
        >
          <div className="saas-dialog max-w-md">
            <p className="text-base font-semibold tracking-tight text-content">Name your chat</p>
            <p className="saas-meta mt-1">Give this conversation a clear title.</p>
            <label htmlFor="new-chat-title" className="saas-field-label mt-5">
              Chat name
            </label>
            <input
              id="new-chat-title"
              autoFocus
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setNewChatModalOpen(false)
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void submitCreateNewChat()
                }
              }}
              placeholder="e.g., Q4 policy review"
              className="saas-input"
            />
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="saas-btn saas-btn-secondary"
                onClick={() => setNewChatModalOpen(false)}
                disabled={creatingNewChat}
              >
                Cancel
              </button>
              <button
                type="button"
                className="saas-btn saas-btn-primary"
                onClick={() => void submitCreateNewChat()}
                disabled={creatingNewChat || newChatTitle.trim().length < 2}
              >
                <Icon name={creatingNewChat ? 'hourglass' : 'plus'} size={16} />
                {creatingNewChat ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameChatId != null ? (
        <div
          className="saas-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Rename chat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRenameChatId(null)
          }}
        >
          <div className="saas-dialog max-w-md">
            <p className="text-base font-semibold tracking-tight text-content">Rename chat</p>
            <p className="saas-meta mt-1">
              Session-only until a rename API is available — refresh will restore the server title.
            </p>
            <input
              autoFocus
              className="saas-input mt-4"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setRenameChatId(null)
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyRenameLocal()
                }
              }}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="saas-btn saas-btn-secondary" onClick={() => setRenameChatId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="saas-btn saas-btn-primary"
                disabled={renameTitle.trim().length < 2}
                onClick={applyRenameLocal}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteChatId != null}
        title="Delete chat?"
        description={`Delete "${pendingDeleteChatTitle ?? 'this chat'}" and all its messages?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteChatId(null)}
        onConfirm={() => {
          if (pendingDeleteChatId == null) return
          void onDeleteChat(pendingDeleteChatId)
          setPendingDeleteChatId(null)
        }}
      />
    </div>
  )
}

/** Sidebar row that shows icon + label when expanded and icon-only (with tooltip) when collapsed. */
function RailItem({
  expanded,
  icon,
  label,
  to,
  onClick,
  disabled,
  emphasis,
}: {
  expanded: boolean
  icon: IconName
  label: string
  to?: string
  onClick?: () => void
  disabled?: boolean
  emphasis?: boolean
}) {
  const className = [
    'saas-nav-item w-full overflow-hidden px-2.5',
    emphasis ? 'text-content' : '',
    disabled ? 'pointer-events-none opacity-50' : '',
  ].join(' ')
  const inner = (
    <>
      <span
        className={[
          'flex size-4 shrink-0 items-center justify-center',
          emphasis ? 'rounded-full bg-[var(--btn-primary-bg)] text-white ring-4 ring-[var(--btn-primary-bg)]' : 'opacity-80',
        ].join(' ')}
      >
        <Icon name={icon} size={emphasis ? 12 : 16} />
      </span>
      <span
        className={[
          'whitespace-nowrap transition-opacity duration-150',
          emphasis ? 'ml-1' : '',
          expanded ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {label}
      </span>
    </>
  )
  const title = expanded ? undefined : label
  if (to) {
    return (
      <Link to={to} className={className} title={title} aria-label={label}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" className={className} title={title} aria-label={label} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  )
}
