import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { askQuestion, createChat, listChats, listMessages, type Chat, type Citation, type Message } from '../services/chat'
import { uploadDocument } from '../services/documents'
import { useWorkspaces } from '../workspaces/WorkspaceContext'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const activeChatTitle = useMemo(() => {
    return chats.find((c) => c.id === activeChatId)?.title ?? 'Chat'
  }, [chats, activeChatId])

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    if (!activeWorkspaceId) return

    const question = draft.trim()
    setDraft('')

    setSending(true)
    try {
      let chatId = activeChatId
      if (!chatId) {
        const created = await createChat(activeWorkspaceId, question.slice(0, 60))
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
          content: question,
          created_at: new Date().toISOString(),
        } as Message,
      ])

      const res = await askQuestion(activeWorkspaceId, question, chatId)
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
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-background-dark">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_360px]">
        <aside className="hidden min-h-0 flex-col border-r border-slate-200 bg-white dark:border-primary/20 dark:bg-background-dark lg:flex">
          <div className="p-4">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              type="button"
              disabled={!activeWorkspaceId}
              onClick={async () => {
                if (!activeWorkspaceId) return
                const created = await createChat(activeWorkspaceId, 'New chat')
                setChats((prev) => [created, ...prev])
                setSearchParams({ chatId: String(created.id) }, { replace: true })
              }}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Chat
            </button>
          </div>

          <nav className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Recent Chats
            </p>
            {chats.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">No chats yet.</div>
            ) : (
              chats.map((c) => {
                const active = activeChatId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSearchParams({ chatId: String(c.id) }, { replace: true })}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                      active
                        ? 'bg-primary/10 text-slate-900 dark:bg-primary/15 dark:text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary/5',
                    ].join(' ')}
                  >
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span className="truncate text-sm font-semibold">{c.title}</span>
                  </button>
                )
              })
            )}
          </nav>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col bg-white dark:bg-surface-dark xl:border-r xl:border-slate-200 xl:dark:border-primary/20">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-primary/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  to="/app"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-primary/10 dark:hover:text-slate-200"
                  aria-label="Back to Dashboard"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{activeChatTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Grounded answers with citations</p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <select
                  className="h-10 max-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:border-primary/20 dark:bg-primary/5 dark:text-slate-200"
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

          <div className="custom-scrollbar min-h-0 flex-1 space-y-8 overflow-y-auto p-4 md:p-6">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-primary/20 dark:bg-primary/5 dark:text-slate-300">
                Ask a question about your uploaded documents to get a grounded answer with citations.
              </div>
            ) : (
              messages.map((m) =>
                m.role === 'assistant' ? (
                  <div key={m.id} className="flex max-w-3xl gap-4">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">DocuMind AI</p>
                      <div className="whitespace-pre-wrap rounded-2xl rounded-tl-none bg-slate-100 p-4 text-sm leading-relaxed dark:bg-primary/10">
                        {m.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="ml-auto flex max-w-3xl flex-row-reverse gap-4">
                    <img
                      alt="User Avatar"
                      className="size-8 shrink-0 rounded-lg"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwDJSri-B_Nr8HjRkdhs-gAhZgUrR6U8IFdcGrFdfkKsEas56Z1hnL-g4iqdcgcOZVZ2_BO0BV_tnyCPgcWkB7sPUXPOMBzFHpOtpH7rNoiL7osDvh4MUtw9qPTox3azQuZMpWlzHmY_LSHKY6oKgyKJ3KPactvDn-4vBfIoC_gLWfEbcATD-yhJhRC73wGxk4BWtu4h0KpglCFHVXy9RSQDOhxW7e29vHoiZ1dGmcX2nAqTvSwR1OYraISQPOYYb3EevyjwAuzjyQ"
                    />
                    <div className="space-y-2 text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">You</p>
                      <div className="inline-block whitespace-pre-wrap rounded-2xl rounded-tr-none bg-primary p-4 text-left text-sm leading-relaxed text-white">
                        {m.content}
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-4 dark:border-primary/20 dark:bg-surface-dark md:p-6">
            <div className="relative mx-auto max-w-3xl">
              {uploadMessage && (
                <div
                  className={[
                    'mb-3 rounded-xl px-4 py-2 text-sm',
                    uploadMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200',
                  ].join(' ')}
                >
                  {uploadMessage.text}
                </div>
              )}
              <form
                className="flex items-center rounded-2xl bg-slate-100 p-2 pr-4 transition-all focus-within:ring-2 focus-within:ring-primary/50 dark:bg-primary/10"
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
                  className="flex-1 border-none bg-transparent px-2 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-0 dark:text-slate-100"
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

        <aside className="hidden min-h-0 flex-col bg-white dark:bg-background-dark xl:flex">
          <div className="border-b border-slate-200 p-4 dark:border-primary/20">
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-primary/20 dark:bg-primary/5 dark:text-slate-300">
                No citations yet. Ask a question once documents are ingested.
              </div>
            ) : (
              citations.map((c) => (
                <div
                  key={`${c.document_id}-${c.chunk_id}`}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary/50 dark:border-primary/20 dark:bg-surface-dark"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={[
                        'flex size-8 items-center justify-center rounded-lg',
                        c.filename.toLowerCase().endsWith('.pdf')
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-emerald-500/10 text-emerald-500',
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
                  <div className="rounded-lg border-l-2 border-primary bg-slate-50 p-3 dark:bg-primary/10">
                    <p className="text-[11px] italic leading-relaxed text-slate-600 dark:text-slate-300">“{c.excerpt}”</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

