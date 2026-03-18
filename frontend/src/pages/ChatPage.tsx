import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { askQuestion, createChat, deleteChat, listChats, listMessages, type Chat, type Citation, type Message } from '../services/chat'
import { uploadDocument } from '../services/documents'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

const STARTER_PROMPTS = [
  'Summarize the key points from my uploaded documents.',
  'List important deadlines or dates mentioned in the files.',
  'Compare conflicting statements across documents with citations.',
]

function messageTime(value: string): string {
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function ChatPage() {
  const { state: wsState } = useWorkspaces()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeWorkspaceId = wsState.status === 'ready' ? wsState.activeWorkspaceId : null
  const activeChatId = searchParams.get('chatId') ? Number(searchParams.get('chatId')) : null

  const [draft, setDraft] = useState('')
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [citations, setCitations] = useState<Citation[]>([])
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<number | null>(null)
  const [newChatModalOpen, setNewChatModalOpen] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [creatingNewChat, setCreatingNewChat] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const refreshChats = useCallback(async () => {
    if (!activeWorkspaceId) return
    const list = await listChats(activeWorkspaceId)
    setChats(list)
    if (!activeChatId && list[0]) {
      setSearchParams({ chatId: String(list[0].id) }, { replace: true })
    }
  }, [activeWorkspaceId, activeChatId, setSearchParams])

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const activeChatTitle = useMemo(() => {
    return chats.find((c) => c.id === activeChatId)?.title ?? 'Assistant'
  }, [chats, activeChatId])

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
      setSearchParams({ chatId: String(created.id) }, { replace: true })
      setNewChatModalOpen(false)
      setNewChatTitle('')
    } finally {
      setCreatingNewChat(false)
    }
  }, [activeWorkspaceId, creatingNewChat, newChatTitle, setSearchParams])

  const onDeleteChat = useCallback(
    async (chatId: number) => {
      if (!activeWorkspaceId) return
      try {
        await deleteChat(chatId, activeWorkspaceId)
        const list = await listChats(activeWorkspaceId)
        setChats(list)
        if (activeChatId === chatId) {
          if (list[0]) {
            setSearchParams({ chatId: String(list[0].id) }, { replace: true })
          } else {
            setSearchParams({}, { replace: true })
            setMessages([])
            setCitations([])
          }
        }
      } catch {
        // ignore
      }
    },
    [activeWorkspaceId, activeChatId, setSearchParams],
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

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return
      if (!activeWorkspaceId) return
      const cleaned = question.trim()
      setDraft('')
      setSending(true)
      try {
        let chatId = activeChatId
        if (!chatId) {
          const created = await createChat(activeWorkspaceId, cleaned.slice(0, 60))
          chatId = created.id
          setChats((prev) => [created, ...prev])
          setSearchParams({ chatId: String(chatId) }, { replace: true })
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

        const res = await askQuestion(activeWorkspaceId, cleaned, chatId)
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
      } finally {
        setSending(false)
      }
    },
    [activeWorkspaceId, activeChatId, refreshChats, setSearchParams],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    await sendQuestion(draft)
  }

  return (
    <div className="h-screen overflow-hidden">
      <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]">
        <aside className="hidden h-full min-h-0 flex-col rounded-2xl border border-white/70 bg-white/55 shadow-sm backdrop-blur lg:flex">
          <div className="border-b border-slate-200/70 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Assistant</p>
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

          <nav className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Chat history
            </p>
            {chats.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">No chats yet.</div>
            ) : (
              chats.map((c) => {
                const active = activeChatId === c.id
                return (
                  <div key={c.id} className="group flex items-center gap-1 pr-1">
                    <button
                      type="button"
                      onClick={() => setSearchParams({ chatId: String(c.id) }, { replace: true })}
                      className={[
                        'flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                        active
                          ? 'bg-primary/12 text-slate-900'
                          : 'text-slate-600 hover:bg-white/70',
                      ].join(' ')}
                    >
                      <span className="material-symbols-outlined text-[20px]">{active ? 'auto_awesome' : 'forum'}</span>
                      <span className="truncate text-sm font-semibold">{c.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteChatId(c.id)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                      aria-label={`Delete chat ${c.title}`}
                      title="Delete chat"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )
              })
            )}
          </nav>
        </aside>

        <section className="flex h-full min-h-0 min-w-0 flex-col rounded-2xl border border-white/70 bg-white/60 shadow-sm backdrop-blur">
          <div className="border-b border-slate-200/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  to="/app"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                  aria-label="Back to Dashboard"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{activeChatTitle}</p>
                  <p className="text-xs text-slate-500">Grounded answers with citations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-white lg:inline-flex"
                  onClick={() => void createNewChat()}
                  disabled={!activeWorkspaceId}
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  New chat
                </button>
                <select
                  className="h-10 max-w-[220px] rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700"
                  value={activeChatId ?? ''}
                  onChange={(e) => setSearchParams({ chatId: String(e.target.value) }, { replace: true })}
                  disabled={chats.length === 0}
                >
                  {chats.length === 0 ? <option value="">No chats</option> : null}
                  {chats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-white/80 bg-white/70 p-6 text-sm text-slate-600 shadow-sm backdrop-blur">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Assistant</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    Ask anything across your documents
                  </h2>
                  <p className="mt-2 text-slate-500">
                    The assistant uses retrieved chunks and returns citation-backed answers.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-white"
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
                      <div className="whitespace-pre-wrap rounded-2xl rounded-tl-none border border-white/80 bg-white/85 p-4 text-sm leading-relaxed text-slate-800 shadow-sm">
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
                      <div className="inline-block whitespace-pre-wrap rounded-2xl rounded-tr-none bg-primary p-4 text-left text-sm leading-relaxed text-white shadow-sm">
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
                <div className="rounded-2xl rounded-tl-none border border-white/80 bg-white/85 px-4 py-3 text-sm text-slate-500 shadow-sm">
                  Thinking...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200/70 bg-white/55 p-4 backdrop-blur md:p-6">
            <div className="relative mx-auto max-w-3xl">
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
              <form
                className="flex items-center rounded-2xl border border-white/80 bg-white/85 p-2 pr-4 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/40"
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
                  className="flex-1 border-none bg-transparent px-2 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-0"
                  placeholder="Ask a follow-up question..."
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  className="size-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 disabled:opacity-60"
                  type="submit"
                  aria-label="Send"
                  disabled={sending}
                >
                  <span className="material-symbols-outlined">{sending ? 'hourglass_top' : 'send'}</span>
                </button>
              </form>
              <p className="mt-3 text-center text-[10px] text-slate-400">
                DocuMind AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </section>

        <aside className="hidden h-full min-h-0 flex-col rounded-2xl border border-white/70 bg-white/55 shadow-sm backdrop-blur xl:flex">
          <div className="border-b border-slate-200/70 p-4">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-bold">Citations & Sources</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {citations.length} DOCS
              </span>
            </div>
            <p className="text-xs text-slate-500">Referenced in the current response</p>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {citations.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-600">
                No citations yet. Ask a question once documents are ingested.
              </div>
            ) : (
              citations.map((c) => (
                <div
                  key={`${c.document_id}-${c.chunk_id}`}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white/85 p-4 transition-colors hover:border-primary/40"
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
                      <p className="text-[10px] text-slate-500">
                        chunk {c.chunk_id}
                        {c.page_number != null ? ` • page ${c.page_number}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border-l-2 border-primary bg-slate-50 p-3">
                    <p className="text-[11px] italic leading-relaxed text-slate-600">“{c.excerpt}”</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
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
          <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white/90 p-5 shadow-2xl backdrop-blur-xl">
            <h3 className="text-base font-extrabold tracking-tight text-slate-900">Name your chat</h3>
            <p className="mt-1 text-sm text-slate-600">Give this conversation a clear title.</p>
            <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-slate-500">Chat name</label>
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
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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

