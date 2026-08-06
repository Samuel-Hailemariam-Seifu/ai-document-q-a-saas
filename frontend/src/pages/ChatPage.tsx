import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
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
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { Icon } from '../components/common/Icon'
import { fileIconName } from '../lib/documents'
import { formatTime } from '../lib/format'

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
    } catch (err) {
      setUploadMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' })
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
      const next = exists
        ? selectedDocumentIds.filter((id) => id !== documentId)
        : [...selectedDocumentIds, documentId]
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
          (error as { message?: string } | null)?.message ||
          'The assistant could not answer right now. Please try again.'
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

  const setPanel = (panel: 'left' | 'right', visible: boolean) => {
    const next = { ...uiPrefs, [panel]: visible }
    setUiPrefs(next)
    writeChatUiPrefs(next)
  }

  const chatList = (onNavigate?: () => void) =>
    chats.length === 0 ? (
      <p className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">No chats yet.</p>
    ) : (
      <div className="flex flex-col gap-0.5">
        {chats.map((c) => {
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
                  'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-2 pl-3 pr-10 text-left text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary dark:text-primary-dark'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white',
                ].join(' ')}
              >
                <Icon name="chat" size={15} className="shrink-0 opacity-70" />
                <span className="truncate">{c.title}</span>
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteChatId(c.id)}
                className="absolute right-1 inline-flex size-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity hover:bg-slate-200/70 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-rose-400"
                aria-label={`Delete chat ${c.title}`}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          )
        })}
      </div>
    )

  const citationList =
    citations.length === 0 ? (
      <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
        <Icon name="book" size={18} className="text-slate-300 dark:text-slate-600" />
        <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          Sources cited by the assistant will appear here.
        </p>
      </div>
    ) : (
      <ol className="divide-y divide-slate-200 dark:divide-slate-800">
        {citations.map((c, index) => (
          <li key={`${c.document_id}-${c.chunk_id}`} className="py-4 first:pt-1">
            <div className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[11px] font-medium tabular-nums text-primary dark:text-primary-dark">
                {index + 1}
              </span>
              <Icon name={fileIconName(c.filename)} size={14} className="shrink-0 text-slate-400" />
              <p className="truncate text-[13px] font-medium text-slate-900 dark:text-white" title={c.filename}>
                {c.filename}
              </p>
            </div>
            <p className="mt-1 pl-7 text-[11px] tabular-nums text-slate-400">
              Chunk {c.chunk_id}
              {c.page_number != null ? ` · page ${c.page_number}` : ''}
            </p>
            <p className="mt-2 ml-7 border-l border-slate-200 pl-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {c.excerpt}
            </p>
          </li>
        ))}
      </ol>
    )

  return (
    <div className="flex h-[100dvh] flex-col bg-background-light dark:bg-background-dark">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-surface-dark md:px-4">
        <Link to="/app" className="saas-icon-btn" aria-label="Back to dashboard" title="Back to dashboard">
          <Icon name="arrowLeft" size={18} />
        </Link>

        {!uiPrefs.left ? (
          <button
            type="button"
            className="saas-icon-btn hidden lg:inline-flex"
            onClick={() => setPanel('left', true)}
            aria-label="Show chats panel"
            title="Show chats"
          >
            <Icon name="panelOpen" size={18} />
          </button>
        ) : null}

        <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">{activeChatTitle}</p>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="saas-icon-btn lg:hidden"
            onClick={() => setMobileChatsOpen(true)}
            aria-label="Open chats"
            title="Chats"
          >
            <Icon name="chat" size={18} />
          </button>
          <button
            type="button"
            className="saas-icon-btn xl:hidden"
            onClick={() => setMobileSourcesOpen(true)}
            aria-label="Open sources"
            title="Sources"
          >
            <Icon name="book" size={18} />
          </button>
          <button
            type="button"
            className="saas-btn saas-btn-primary hidden lg:inline-flex"
            onClick={createNewChat}
            disabled={!activeWorkspaceId}
          >
            <Icon name="plus" size={16} />
            New chat
          </button>
          {!uiPrefs.right ? (
            <button
              type="button"
              className="saas-icon-btn hidden xl:inline-flex"
              onClick={() => setPanel('right', true)}
              aria-label="Show sources panel"
              title="Show sources"
            >
              <Icon name="panelRightOpen" size={18} />
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {uiPrefs.left ? (
          <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-dark lg:flex">
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <p className="saas-label">Chats</p>
              <button
                type="button"
                className="saas-icon-btn size-8"
                onClick={() => setPanel('left', false)}
                aria-label="Hide chats panel"
                title="Hide panel"
              >
                <Icon name="panelClose" size={16} />
              </button>
            </div>
            <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">{chatList()}</nav>
          </aside>
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-7">
              {messages.length === 0 ? (
                <div className="py-6 text-center">
                  <span className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary-dark">
                    <Icon name="sparkles" size={18} />
                  </span>
                  <h2 className="mt-4 font-heading text-lg font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
                    Ask anything across your documents
                  </h2>
                  <p className="saas-meta mt-1.5">Answers are built from retrieved chunks and come with citations.</p>

                  <div className="mx-auto mt-6 flex max-w-md flex-col gap-1.5">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 text-left text-[13px] text-slate-600 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
                        onClick={() => {
                          setDraft(prompt)
                          void sendQuestion(prompt)
                        }}
                      >
                        <span>{prompt}</span>
                        <Icon
                          name="chevronRight"
                          size={14}
                          className="shrink-0 text-slate-300 transition-colors group-hover:text-primary dark:text-slate-600"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) =>
                  m.role === 'assistant' ? (
                    <div key={m.id} className="group flex gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary dark:text-primary-dark">
                        <Icon name="sparkles" size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                          {m.content}
                        </div>
                        <p className="mt-1 text-[11px] tabular-nums text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="group flex flex-col items-end">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-slate-100 px-3.5 py-2.5 text-sm leading-relaxed text-slate-800 dark:bg-white/5 dark:text-slate-200">
                        {m.content}
                      </div>
                      <p className="mt-1 text-[11px] tabular-nums text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  ),
                )
              )}

              {sending ? (
                <div className="flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary dark:text-primary-dark">
                    <Icon name="sparkles" size={14} className="animate-pulse" />
                  </span>
                  <p className="text-sm leading-7 text-slate-400 dark:text-slate-500">Thinking…</p>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div
            className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-surface-dark md:px-6"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="relative mx-auto max-w-3xl">
              {uploadMessage || chatError ? (
                <div
                  className={[
                    'mb-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
                    chatError
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      : uploadMessage?.type === 'error'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                  ].join(' ')}
                >
                  <Icon
                    name={chatError || uploadMessage?.type === 'error' ? 'alert' : 'check'}
                    size={14}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{chatError ?? uploadMessage?.text}</span>
                </div>
              ) : null}

              {attachmentOpen ? (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-surface-dark">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="saas-label">Sources in scope</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-500 hover:underline disabled:opacity-50 dark:text-slate-400"
                        onClick={() => updateDocumentSelection([])}
                        disabled={selectedDocumentIds.length === 0}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline disabled:opacity-50 dark:text-primary-dark"
                        onClick={() => updateDocumentSelection(readyDocuments.map((doc) => doc.id))}
                        disabled={readyDocuments.length === 0}
                      >
                        Select all
                      </button>
                    </div>
                  </div>
                  {readyDocuments.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No ready documents yet. Upload a file and wait for ingestion.
                    </p>
                  ) : (
                    <div className="custom-scrollbar max-h-52 overflow-y-auto pr-1">
                      {readyDocuments.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(doc.id)}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            className="size-3.5 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-600"
                          />
                          <span className="truncate">{doc.original_name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <form
                className="rounded-xl border border-slate-200 bg-white transition-colors focus-within:border-primary/50 dark:border-slate-700 dark:bg-background-dark"
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

                <input
                  className="h-11 w-full bg-transparent px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="Ask a question about your documents…"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />

                <div className="flex items-center gap-1 px-1.5 pb-1.5">
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-slate-200"
                    aria-label="Upload a document"
                    title="Upload a document"
                    disabled={!activeWorkspaceId || uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon name={uploading ? 'hourglass' : 'paperclip'} size={16} />
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
                    onClick={() => setAttachmentOpen((open) => !open)}
                    aria-expanded={attachmentOpen}
                  >
                    <Icon name="folder" size={14} />
                    {selectedDocuments.length === 0
                      ? 'No sources'
                      : `${selectedDocuments.length} source${selectedDocuments.length === 1 ? '' : 's'}`}
                  </button>

                  <button
                    type="submit"
                    className="ml-auto inline-flex size-8 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
                    aria-label="Send"
                    disabled={sending || !draft.trim()}
                  >
                    <Icon name={sending ? 'hourglass' : 'send'} size={15} />
                  </button>
                </div>
              </form>

              <p className="mt-2 text-center text-[11px] text-slate-400">
                DocuMind AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </section>

        {uiPrefs.right ? (
          <aside className="hidden w-80 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-dark xl:flex">
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="saas-label">Sources</p>
                <span className="saas-badge bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {citations.length}
                </span>
              </div>
              <button
                type="button"
                className="saas-icon-btn size-8"
                onClick={() => setPanel('right', false)}
                aria-label="Hide sources panel"
                title="Hide panel"
              >
                <Icon name="panelRightClose" size={16} />
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">{citationList}</div>
          </aside>
        ) : null}
      </div>

      {mobileChatsOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Chats"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileChatsOpen(false)
          }}
        >
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl bg-white dark:bg-surface-dark">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="saas-section-title">Chats</p>
              <button
                type="button"
                className="saas-icon-btn"
                onClick={() => setMobileChatsOpen(false)}
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="custom-scrollbar max-h-[calc(85dvh-56px)] overflow-y-auto p-3">
              <button
                type="button"
                className="saas-btn saas-btn-primary mb-3 w-full"
                disabled={!activeWorkspaceId}
                onClick={() => {
                  createNewChat()
                  setMobileChatsOpen(false)
                }}
              >
                <Icon name="plus" size={16} />
                New chat
              </button>
              {chatList(() => setMobileChatsOpen(false))}
            </div>
          </div>
        </div>
      ) : null}

      {mobileSourcesOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Sources"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileSourcesOpen(false)
          }}
        >
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl bg-white dark:bg-surface-dark">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <p className="saas-section-title">Sources</p>
                <span className="saas-badge bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {citations.length}
                </span>
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
            <div className="custom-scrollbar max-h-[calc(85dvh-56px)] overflow-y-auto p-4">{citationList}</div>
          </div>
        </div>
      ) : null}

      {newChatModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Create chat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setNewChatModalOpen(false)
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-surface-dark">
            <p className="saas-section-title">Name your chat</p>
            <p className="saas-meta mt-1">Give this conversation a clear title.</p>
            <label htmlFor="new-chat-title" className="saas-label mt-4 block">
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
              className="saas-input mt-2"
            />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
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
