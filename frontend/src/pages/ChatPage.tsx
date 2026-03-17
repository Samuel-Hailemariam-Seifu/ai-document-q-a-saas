import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { askQuestion, createChat, listChats, listMessages, type Chat, type Citation, type Message } from '../services/chat'
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
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <aside className="flex h-full w-72 flex-shrink-0 flex-col border-r border-slate-200 bg-background-light dark:border-accent-dark dark:bg-background-dark">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">DocuMind AI</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Research Assistant
            </p>
          </div>
        </div>

        <div className="mb-4 px-4">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            type="button"
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

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-2">
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
                      ? 'bg-slate-200 text-slate-900 dark:bg-accent-dark dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-accent-dark/50',
                  ].join(' ')}
                >
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                  <span className="truncate text-sm font-medium">{c.title}</span>
                </button>
              )
            })
          )}
        </nav>

        <div className="space-y-1 border-t border-slate-200 p-4 dark:border-accent-dark">
          {[
            ['settings', 'Settings'],
            ['help', 'Help Center'],
          ].map(([icon, label]) => (
            <button
              key={label}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-accent-dark/50"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {icon}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}

          <div className="mt-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4">
            <p className="mb-1 text-xs font-bold text-primary">PRO PLAN</p>
            <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
              Unlimited uploads & 4K model access.
            </p>
            <button
              className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-white"
              type="button"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col bg-white dark:bg-surface-dark">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-accent-dark">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              auto_awesome
            </span>
            <h2 className="text-sm font-semibold">
              {chats.find((c) => c.id === activeChatId)?.title ?? 'Chat'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {['search', 'ios_share'].map((i) => (
              <button
                key={i}
                className="p-2 text-slate-400 transition-colors hover:text-primary"
                type="button"
              >
                <span className="material-symbols-outlined">{i}</span>
              </button>
            ))}
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-accent-dark" />
            <img
              alt="User Profile"
              className="size-8 rounded-full border border-slate-200 dark:border-accent-dark"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnY7K3XmC0B-f-7z2EdCD2CI2SSYpQvmumQ_Iu16mnYng6zJWu1r8QHUINbyDZ5JWFdZctzbbQ5nGQ8N4ZK-J7QMuwJZ_isE8UNUJ0J71nUy38GHJOypPPJIopqegE4iCPAaiiKf5ZBwzzn6IIAVF2s6Njdj0i5F-Re5wub56WVanKH4Tj0IGEBxIlMEU4wBZeFMZ9YQXlGusITasfGAjgA_OXINyG7EGGEIu2WXzUjaOHDkXk3nBg05Ugsq2XFxL87yySUdB_Qhps"
            />
          </div>
        </header>

        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
          {messages.map((m) =>
            m.role === 'assistant' ? (
              <div key={m.id} className="flex max-w-3xl gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined text-[20px]">
                    smart_toy
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    DocuMind AI
                  </p>
                  <div className="whitespace-pre-wrap rounded-2xl rounded-tl-none bg-slate-100 p-4 text-sm leading-relaxed dark:bg-accent-dark">
                    {m.content}
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={m.id}
                className="ml-auto flex max-w-3xl flex-row-reverse gap-4"
              >
                <img
                  alt="User Avatar"
                  className="size-8 shrink-0 rounded-lg"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwDJSri-B_Nr8HjRkdhs-gAhZgUrR6U8IFdcGrFdfkKsEas56Z1hnL-g4iqdcgcOZVZ2_BO0BV_tnyCPgcWkB7sPUXPOMBzFHpOtpH7rNoiL7osDvh4MUtw9qPTox3azQuZMpWlzHmY_LSHKY6oKgyKJ3KPactvDn-4vBfIoC_gLWfEbcATD-yhJhRC73wGxk4BWtu4h0KpglCFHVXy9RSQDOhxW7e29vHoiZ1dGmcX2nAqTvSwR1OYraISQPOYYb3EevyjwAuzjyQ"
                />
                <div className="space-y-2 text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    You
                  </p>
                  <div className="inline-block whitespace-pre-wrap rounded-2xl rounded-tr-none bg-primary p-4 text-left text-sm leading-relaxed text-white">
                    {m.content}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>

        <footer className="border-t border-slate-200 bg-white p-6 dark:border-accent-dark dark:bg-surface-dark">
          <div className="relative mx-auto max-w-3xl">
            <form
              className="flex items-center rounded-2xl bg-slate-100 p-2 pr-4 transition-all focus-within:ring-2 focus-within:ring-primary/50 dark:bg-accent-dark"
              onSubmit={onSubmit}
            >
              <button
                className="p-2 text-slate-400 hover:text-primary"
                type="button"
                aria-label="Attach file"
              >
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <input
                className="flex-1 border-none bg-transparent px-2 py-3 text-sm placeholder:text-slate-500 focus:ring-0"
                placeholder="Ask a follow-up question..."
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                className="size-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
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
        </footer>
      </main>

      <aside className="flex h-full w-80 flex-shrink-0 flex-col border-l border-slate-200 bg-background-light dark:border-accent-dark dark:bg-background-dark">
        <div className="border-b border-slate-200 p-6 dark:border-accent-dark">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold">Citations & Sources</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {citations.length} DOCUMENTS
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Referenced in the current response
          </p>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
          {citations.map((c) => (
            <div
              key={`${c.document_id}-${c.chunk_id}`}
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary/50 dark:border-accent-dark dark:bg-surface-dark"
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
                    chunk {c.chunk_id}{c.page_number != null ? ` • page ${c.page_number}` : ''}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border-l-2 border-primary bg-slate-50 p-3 dark:bg-accent-dark/40">
                <p className="text-[11px] italic leading-relaxed text-slate-600 dark:text-slate-400">
                  “{c.excerpt}”
                </p>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Document Relationships
            </p>
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-accent-dark">
              <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-primary to-transparent" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">
                  hub
                </span>
                <p className="text-[10px] text-slate-500">Connection Graph</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold transition-colors hover:bg-slate-100 dark:border-accent-dark dark:hover:bg-accent-dark/50"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            Export Citation List
          </button>
        </div>
      </aside>
    </div>
  )
}

