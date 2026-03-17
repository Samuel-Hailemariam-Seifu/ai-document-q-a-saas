import { useMemo, useState, type FormEvent } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type Citation = {
  id: string
  filename: string
  meta: string
  excerpt: string
  icon: 'pdf' | 'article'
}

export function ChatPage() {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      role: 'assistant',
      content:
        "Hello! I've analyzed the documents in Project Alpha. Based on the Q3 report, the primary risk factors include supply chain disruptions in the semiconductor sector and upcoming regulatory changes in the EU regarding AI data privacy.",
    },
    {
      id: 'm2',
      role: 'user',
      content:
        'Can you provide the specific citations for the EU regulatory changes mentioned in the report?',
    },
    {
      id: 'm3',
      role: 'assistant',
      content:
        'Certainly. The regulatory changes are primarily detailed in:\n\n• Section 4.2 of Compliance_Final.pdf\n• Page 12, Paragraph 3 of Strategic_Outlook_2024.pdf\n\nI have highlighted these sections in the Citations panel on the right.',
    },
  ])

  const citations = useMemo<Citation[]>(
    () => [
      {
        id: 'c1',
        filename: 'Compliance_Final.pdf',
        meta: '2.4 MB • Updated Oct 12',
        excerpt:
          '"...regulatory frameworks surrounding the EU AI Act will necessitate significant changes to data ingestion protocols by Q1 2024..."',
        icon: 'pdf',
      },
      {
        id: 'c2',
        filename: 'Strategic_Outlook_2024.pdf',
        meta: '1.1 MB • Updated Sep 28',
        excerpt:
          '"Page 12: Exposure to European markets is contingent on compliance with updated privacy guidelines scheduled for parliamentary review..."',
        icon: 'article',
      },
    ],
    [],
  )

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: draft.trim() },
    ])
    setDraft('')
    // Phase 6: wire to backend Q&A endpoint and stream/append assistant response
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
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Chat
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-2">
          <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Recent Chats
          </p>
          <a
            className="flex items-center gap-3 rounded-xl bg-slate-200 px-4 py-3 text-slate-900 dark:bg-accent-dark dark:text-white"
            href="#"
          >
            <span className="material-symbols-outlined text-[20px] fill-current">
              chat_bubble
            </span>
            <span className="truncate text-sm font-medium">
              Project Alpha Analysis
            </span>
          </a>
          {[
            ['description', 'Market Research Q4'],
            ['shield', 'Legal Review - Patents'],
            ['code', 'API Integration Docs'],
          ].map(([icon, title]) => (
            <a
              key={title}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-accent-dark/50"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px]">
                {icon}
              </span>
              <span className="truncate text-sm font-medium">{title}</span>
            </a>
          ))}
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
            <h2 className="text-sm font-semibold">Project Alpha Analysis</h2>
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
              >
                <span className="material-symbols-outlined">send</span>
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
              key={c.id}
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary/50 dark:border-accent-dark dark:bg-surface-dark"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={[
                    'flex size-8 items-center justify-center rounded-lg',
                    c.icon === 'pdf'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-blue-500/10 text-blue-500',
                  ].join(' ')}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {c.icon === 'pdf' ? 'picture_as_pdf' : 'article'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{c.filename}</p>
                  <p className="text-[10px] text-slate-500">{c.meta}</p>
                </div>
              </div>
              <div className="rounded-lg border-l-2 border-primary bg-slate-50 p-3 dark:bg-accent-dark/40">
                <p className="text-[11px] italic leading-relaxed text-slate-600 dark:text-slate-400">
                  {c.excerpt}
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

