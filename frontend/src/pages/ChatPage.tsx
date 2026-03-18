import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { askQuestion, createChat, deleteChat, listChats, listMessages, type Chat, type Citation, type Message } from '../services/chat'
import { listDocuments, uploadDocument, type DocumentListItem } from '../services/documents'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

const STARTER_PROMPTS = [
  'Summarize the key points from my uploaded documents.',
  'List important deadlines or dates mentioned in the files.',
  'Compare conflicting statements across documents with citations.',
]

const CHAT_DOC_SELECTION_KEY = 'documind.chat.selectedDocumentIds'
const CHAT_UI_PREFS_KEY = 'documind.chat.uiPrefs'

function readChatUiPrefs(): { left: boolean; right: boolean } {
  try {
    const raw = localStorage.getItem(CHAT_UI_PREFS_KEY)
    if (!raw) return { left: true, right: true }
    const parsed = JSON.parse(raw) as { left?: unknown; right?: unknown }
    return {
      left: parsed.left !== false,
      right: parsed.right !== false,
    }
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

function messageTime(value: string): string {
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
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

export function ChatPage() {
  const { state: wsState } = useWorkspaces()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeWorkspaceId = wsState.status === 'ready' ? wsState.activeWorkspaceId : null
  const activeChatId = searchParams.get('chatId') ? Number(searchParams.get('chatId')) : null
  const searchDocIds = useMemo(() => parseDocumentIds(searchParams.get('docIds')), [searchParams])

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
  const [chatError, setChatError] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<number | null>(null)
  const [newChatModalOpen, setNewChatModalOpen] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [creatingNewChat, setCreatingNewChat] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

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
      return
    }
    const list = await listMessages(activeChatId, activeWorkspaceId)
    setMessages(list)
    const lastAssistant = [...list].reverse().find((m) => m.role === 'assistant' && m.citations?.length)
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

  const activeChatTitle = useMemo(() => {
    return chats.find((c) => c.id === activeChatId)?.title ?? 'Assistant'
  }, [chats, activeChatId])

  const selectedDocuments = useMemo(
    () => readyDocuments.filter((doc) => selectedDocumentIds.includes(doc.id)),
    [readyDocuments, selectedDocumentIds],
  )

  const createNewChat = useCallback(async () => {
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
    } catch (err) {
      setUploadMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed',
      })
      setTimeout(() => setUploadMessage(null), 5000)
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
      const next = exists ? selectedDocumentIds.filter((id) => id !== documentId) : [...selectedDocumentIds, documentId]
      updateDocumentSelection(next)
    },
    [selectedDocumentIds, updateDocumentSelection],
  )

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return
      if (!activeWorkspaceId) return
      const cleaned = question.trim()
      setDraft('')
      setSending(true)
      setChatError(null)
      try {
        let chatId = activeChatId
        if (!chatId) {
          const created = await createChat(activeWorkspaceId, cleaned.slice(0, 60))
          chatId = created.id
          setChats((prev) => [created, ...prev])
          updateSearchParams({ chatId })
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            chat_id: chatId!,
            role: 'user',
            content: cleaned,
            created_at: new Date().toISOString(),
          } as Message,
        ])

        const res = await askQuestion(activeWorkspaceId, cleaned, chatId, selectedDocumentIds)
        setCitations(res.citations)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            chat_id: res.chat_id,
            role: 'assistant',
            content: res.answer,
            citations: res.citations,
            created_at: new Date().toISOString(),
          } as Message,
        ])
        await refreshChats()
      } catch (error) {
        const message =
          (error as { message?: string } | null)?.message || 'The assistant could not answer right now. Please try again.'
        setChatError(message)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            chat_id: activeChatId ?? 0,
            role: 'assistant',
            content: `I could not generate a response. ${message}`,
            created_at: new Date().toISOString(),
          } as Message,
        ])
      } finally {
        setSending(false)
      }
    },
    [activeWorkspaceId, activeChatId, refreshChats, selectedDocumentIds, updateSearchParams],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    await sendQuestion(draft)
  }

  const gridClass = useMemo(() => {
    // left sidebar only shows on lg+, right sidebar on xl+
    const left = uiPrefs.left
    const right = uiPrefs.right
    if (left && right) return 'lg:grid-cols-[290px_1fr] xl:grid-cols-[290px_1fr_330px]'
    if (left && !right) return 'lg:grid-cols-[290px_1fr] xl:grid-cols-[290px_1fr]'
    if (!left && right) return 'lg:grid-cols-[1fr] xl:grid-cols-[1fr_330px]'
    return 'lg:grid-cols-[1fr] xl:grid-cols-[1fr]'
  }, [uiPrefs.left, uiPrefs.right])

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent">
      <div className={['px-3 py-3 sm:px-4 sm:py-5 md:px-6 md:py-6 grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-3', gridClass].join(' ')}>
        {uiPrefs.left ? (
          <aside className=" hidden h-full min-h-0 flex-col rounded-3xl border border-slate-200/80 bg-white/75 shadow-lg backdrop-blur-xl lg:flex dark:border-primary/20 dark:bg-background-dark/60">
          <div className="border-b border-slate-200/70 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Assistant</p>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 transition-colors hover:bg-white hover:text-slate-800 dark:border-primary/20 dark:bg-background-dark/60 dark:text-slate-200 dark:hover:bg-primary/10 dark:hover:text-white"
                onClick={() => {
                  const next = { ...uiPrefs, left: false }
                  setUiPrefs(next)
                  writeChatUiPrefs(next)
                }}
                title="Hide chats sidebar"
                aria-label="Hide chats sidebar"
              >
                <span className="material-symbols-outlined text-[18px]">left_panel_close</span>
              </button>
            </div>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              type="button"
              disabled={!activeWorkspaceId}
              onClick={() => void createNewChat()}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              New chat
            </button>
          </div>

          <nav className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4 pt-2">
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Chat history
            </p>
            {chats.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-primary/10 dark:text-slate-300">
                No chats yet.
              </div>
            ) : (
              chats.map((c) => {
                const active = activeChatId === c.id
                return (
                                  <div key={c.id} className="group relative flex items-center gap-1 px-2">
                  {/* Main Chat Navigation Button */}
                  <button
                    type="button"
                    onClick={() => setSearchParams({ chatId: String(c.id) }, { replace: true })}
                    className={`
                      flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200
                      ${active 
                        ? 'border-primary/20 bg-primary/10 text-primary shadow-sm' 
                        : 'border-transparent text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-primary/10 dark:hover:text-white'}
                    `}
                  >
                    {/* Dynamic Icon */}
                    <span className={`material-symbols-outlined text-[20px] shrink-0 transition-transform ${active ? 'scale-110' : ''}`}>
                      {active ? 'auto_awesome' : 'chat_bubble_outline'}
                    </span>

                    {/* Title - Shrunk slightly to account for delete button hover space */}
                    <span className="truncate text-[13px] font-medium flex-1">
                      {c.title}
                    </span>
                  </button>

                  {/* Delete Action - Anchored to the right side of the container */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteChatId(c.id);
                    }}
                    className={`
                      absolute right-4 flex h-8 w-8 items-center justify-center rounded-lg 
                      bg-gradient-to-l from-white via-white to-transparent pl-2
                      text-slate-400 opacity-0 transition-all duration-200 
                      hover:text-rose-600 group-hover:opacity-100
                      ${active ? 'from-primary/10 via-primary/10' : 'from-slate-100 via-slate-100'}
                    `}
                    aria-label={`Delete chat ${c.title}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                )
              })
            )}
          </nav>
          </aside>
        ) : null}

        <section className="flex h-full min-h-0 min-w-0 flex-col rounded-3xl border border-slate-200/80 bg-white/70 shadow-lg backdrop-blur-xl dark:border-primary/20 dark:bg-background-dark/60 sm:rounded-3xl sm:border-slate-200/80 border-transparent sm:border">
          <div className="border-b border-slate-200/70 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  to="/app"
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-700 dark:border-primary/20 dark:bg-background-dark dark:text-slate-300 dark:hover:text-white"
                  aria-label="Back to Dashboard"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold tracking-tight text-slate-900 dark:text-white">{activeChatTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Grounded answers with verifiable citations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile quick access */}
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-white dark:border-primary/20 dark:bg-background-dark/60 dark:text-slate-200 dark:hover:bg-primary/10 lg:hidden"
                  onClick={() => setMobileChatsOpen(true)}
                  aria-label="Open chats"
                  title="Chats"
                >
                  <span className="material-symbols-outlined text-[16px]">forum</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-white dark:border-primary/20 dark:bg-background-dark/60 dark:text-slate-200 dark:hover:bg-primary/10 lg:hidden"
                  onClick={() => setMobileSourcesOpen(true)}
                  aria-label="Open sources"
                  title="Sources"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                </button>
                <button
                  type="button"
                  className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-white lg:inline-flex dark:border-primary/20 dark:bg-background-dark/60 dark:text-slate-200 dark:hover:bg-primary/10"
                  onClick={() => void createNewChat()}
                  disabled={!activeWorkspaceId}
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  New chat
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Papers:</span>
              {selectedDocuments.length === 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                  None selected
                </span>
              ) : (
                selectedDocuments.slice(0, 3).map((doc) => (
                  <span key={doc.id} className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
                    {doc.original_name}
                  </span>
                ))
              )}
              {selectedDocuments.length > 3 ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600 dark:bg-primary/10 dark:text-slate-200">
                  +{selectedDocuments.length - 3} more
                </span>
              ) : null}
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto bg-white/30 p-5 md:p-7 dark:bg-primary/5">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-white/80 bg-white/80 p-7 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-primary/20 dark:bg-background-dark/60 dark:text-slate-300">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Assistant</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Ask anything across your documents
                  </h2>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">
                    The assistant uses retrieved chunks and returns citation-backed answers.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-3 ">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="py-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/10"
                      onClick={() => {
                        setDraft(prompt)
                        void sendQuestion(prompt)
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === 'assistant' ? (
                  <div key={m.id} className="flex max-w-3xl gap-3">
                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Assistant • {messageTime(m.created_at)}
                      </p>
                      <div className="whitespace-pre-wrap rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-sm dark:border-primary/20 dark:bg-background-dark dark:text-slate-200">
                        {m.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="ml-auto flex max-w-3xl flex-row-reverse gap-3">
                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                      <span className="material-symbols-outlined text-[17px]">person</span>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        You • {messageTime(m.created_at)}
                      </p>
                      <div className="inline-block whitespace-pre-wrap rounded-2xl rounded-tr-none bg-primary px-4 py-3.5 text-left text-sm leading-relaxed text-white shadow-sm">
                        {m.content}
                      </div>
                    </div>
                  </div>
                )
              )
            )}
            {sending ? (
              <div className="flex max-w-3xl gap-3">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined animate-pulse text-[18px]">auto_awesome</span>
                </div>
                <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-primary/20 dark:bg-background-dark dark:text-slate-300">
                  Thinking...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200/70 bg-white/75 p-3 backdrop-blur md:p-6 rounded-3xl dark:border-primary/20 dark:bg-background-dark/60 sm:p-4"
               style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="relative w-full sm:mx-auto sm:max-w-3xl">
              {uploadMessage && (
                <div
                  className={[
                    'mb-3 rounded-xl px-4 py-2 text-sm',
                    uploadMessage.type === 'success'
                      ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200',
                  ].join(' ')}
                >
                  {uploadMessage.text}
                </div>
              )}
              {chatError ? (
                <div className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  {chatError}
                </div>
              ) : null}
              <form
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/30 dark:border-primary/20 dark:bg-background-dark sm:flex-row sm:items-center sm:gap-0 sm:pr-4"
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
                <div className="flex items-center gap-1 sm:gap-0">
                  <button
                    className="p-2 text-slate-400 hover:text-primary disabled:opacity-50"
                    type="button"
                    title="Choose papers for this chat"
                    aria-label="Choose papers"
                    onClick={() => setAttachmentOpen((open) => !open)}
                  >
                    <span className="material-symbols-outlined">folder_data</span>
                  </button>
                  <button
                    className="p-2 text-slate-400 hover:text-primary disabled:opacity-50"
                    type="button"
                    aria-label="Attach file"
                    disabled={!activeWorkspaceId || uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined">
                      {uploading ? 'hourglass_top' : 'attach_file'}
                    </span>
                  </button>
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-100 dark:placeholder:text-slate-500 sm:border-0 sm:bg-transparent sm:px-2 sm:py-3 sm:focus:ring-0"
                    placeholder="Ask a follow-up question..."
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button
                    className="h-10 w-10 shrink-0 rounded-xl bg-primary text-white shadow-md shadow-primary/20 disabled:opacity-60"
                    type="submit"
                    aria-label="Send"
                    disabled={sending}
                  >
                    <span className="material-symbols-outlined">{sending ? 'hourglass_top' : 'send'}</span>
                  </button>
                </div>
              </form>
              {attachmentOpen ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-primary/20 dark:bg-background-dark">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Papers in scope</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-600 hover:underline disabled:text-slate-400"
                        onClick={() => updateDocumentSelection([])}
                        disabled={selectedDocumentIds.length === 0}
                      >
                        Clear all papers
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => updateDocumentSelection(readyDocuments.map((doc) => doc.id))}
                        disabled={readyDocuments.length === 0}
                      >
                        Select all ready papers
                      </button>
                    </div>
                  </div>
                  {readyDocuments.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No ready documents yet. Upload and wait for ingestion first.</p>
                  ) : (
                    <div className="custom-scrollbar max-h-44 space-y-1 overflow-y-auto pr-1">
                      {readyDocuments.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-primary/10"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(doc.id)}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="truncate">{doc.original_name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              <p className="mt-3 text-center text-[10px] text-slate-400">
                DocuMind AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </section>

        {uiPrefs.right ? (
          <aside className="hidden h-full min-h-0 flex-col rounded-3xl border border-slate-200/80 bg-white/75 shadow-lg backdrop-blur-xl xl:flex dark:border-primary/20 dark:bg-background-dark/60">
          <div className="border-b border-slate-200/70 p-4 ">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Citations & Sources</h3>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {citations.length} DOCS
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/10 dark:hover:text-white"
                    onClick={() => {
                      const next = { ...uiPrefs, right: false }
                      setUiPrefs(next)
                      writeChatUiPrefs(next)
                    }}
                    title="Hide sources sidebar"
                    aria-label="Hide sources sidebar"
                  >
                    <span className="material-symbols-outlined text-[18px]">right_panel_close</span>
                  </button>
                </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Referenced in the current response</p>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-12 mb-4">
            {citations.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-300">
                No citations yet. Ask a question once documents are ingested.
              </div>
            ) : (
              citations.map((c) => (
                <div
                  key={`${c.document_id}-${c.chunk_id}`}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm dark:border-primary/20 dark:bg-background-dark dark:hover:border-primary/50"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={[
                        'flex size-8 items-center justify-center rounded-lg',
                        c.filename.toLowerCase().endsWith('.pdf')
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-blue-500/10 text-blue-500',
                      ].join(' ')}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {c.filename.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'article'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">{c.filename}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        chunk {c.chunk_id}
                        {c.page_number != null ? ` • page ${c.page_number}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border-l-2 border-primary bg-slate-50 p-3 dark:bg-primary/10">
                    <p className="text-[11px] italic leading-relaxed text-slate-600 dark:text-slate-300">“{c.excerpt}”</p>
                  </div>
                </div>
              ))
            )}
          </div>
          </aside>
        ) : null}
      </div>

      {!uiPrefs.left ? (
        <button
          type="button"
          className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-700 shadow-lg backdrop-blur transition-colors hover:bg-white lg:inline-flex dark:border-primary/20 dark:bg-background-dark/60 dark:text-slate-200 dark:hover:bg-primary/10"
          onClick={() => {
            const next = { ...uiPrefs, left: true }
            setUiPrefs(next)
            writeChatUiPrefs(next)
          }}
          title="Show chats sidebar"
          aria-label="Show chats sidebar"
        >
          <span className="material-symbols-outlined text-[20px]">left_panel_open</span>
        </button>
      ) : null}

      {!uiPrefs.right ? (
        <button
          type="button"
          className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-700 shadow-lg backdrop-blur transition-colors hover:bg-white xl:inline-flex dark:border-primary/20 dark:bg-background-dark/60 dark:text-slate-200 dark:hover:bg-primary/10"
          onClick={() => {
            const next = { ...uiPrefs, right: true }
            setUiPrefs(next)
            writeChatUiPrefs(next)
          }}
          title="Show sources sidebar"
          aria-label="Show sources sidebar"
        >
          <span className="material-symbols-outlined text-[20px]">right_panel_open</span>
        </button>
      ) : null}

      {/* Mobile chats drawer */}
      {mobileChatsOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Chats"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileChatsOpen(false)
          }}
        >
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-primary/20 dark:bg-background-dark/90">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-primary/20">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Chats</p>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/10"
                onClick={() => setMobileChatsOpen(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="custom-scrollbar max-h-[calc(85dvh-56px)] overflow-y-auto p-3">
              <button
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                type="button"
                disabled={!activeWorkspaceId}
                onClick={() => {
                  void createNewChat()
                  setMobileChatsOpen(false)
                }}
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                New chat
              </button>

              {chats.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-primary/10 dark:text-slate-300">
                  No chats yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {chats.map((c) => {
                    const active = activeChatId === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSearchParams({ chatId: String(c.id) }, { replace: true })
                          setMobileChatsOpen(false)
                        }}
                        className={[
                          'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors',
                          active
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-transparent bg-white text-slate-700 hover:bg-slate-50 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/10',
                        ].join(' ')}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {active ? 'auto_awesome' : 'forum'}
                        </span>
                        <span className="truncate">{c.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile sources drawer */}
      {mobileSourcesOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Sources"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileSourcesOpen(false)
          }}
        >
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-primary/20 dark:bg-background-dark/90">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-primary/20">
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">Sources</p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {citations.length} DOCS
                </span>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/10"
                onClick={() => setMobileSourcesOpen(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="custom-scrollbar max-h-[calc(85dvh-56px)] overflow-y-auto p-4">
              {citations.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-300">
                  No citations yet. Ask a question once documents are ingested.
                </div>
              ) : (
                <div className="space-y-3">
                  {citations.map((c) => (
                    <div
                      key={`${c.document_id}-${c.chunk_id}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-primary/20 dark:bg-background-dark"
                    >
                      <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{c.filename}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        chunk {c.chunk_id}
                        {c.page_number != null ? ` • page ${c.page_number}` : ''}
                      </p>
                      <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-primary/10">
                        <p className="text-xs italic leading-relaxed text-slate-600 dark:text-slate-300">“{c.excerpt}”</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {newChatModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Create chat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setNewChatModalOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white/90 p-5 shadow-2xl backdrop-blur-xl dark:border-primary/20 dark:bg-background-dark/80">
            <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Name your chat</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Give this conversation a clear title.</p>
            <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Chat name</label>
            <input
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
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-primary/20 dark:bg-background-dark dark:text-slate-100"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-primary/10"
                onClick={() => setNewChatModalOpen(false)}
                disabled={creatingNewChat}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                onClick={() => void submitCreateNewChat()}
                disabled={creatingNewChat || newChatTitle.trim().length < 2}
              >
                {creatingNewChat ? 'Creating...' : 'Create'}
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

