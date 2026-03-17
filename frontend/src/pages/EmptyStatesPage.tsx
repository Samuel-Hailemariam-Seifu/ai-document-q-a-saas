import { Link } from 'react-router-dom'

export function EmptyStatesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-slate-500 dark:text-slate-400">Ready to analyze some documents today?</p>
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Documents</h2>
          <button
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Upload New
          </button>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 px-6 py-16 dark:border-primary/20 dark:bg-primary/5">
          <div className="relative mb-8 h-48 w-48">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl opacity-50" />
            <img
              alt="No Documents"
              className="relative z-10 h-full w-full rounded-xl object-contain mix-blend-luminosity dark:mix-blend-normal"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmw_-Oq8J92V6aWeahz1h35ra45SGk-AgLDqDzfTTSYUJTWk3UPNjObWuzjtlHrPDPKe-HgtPG1JMwrOkiFBMlr9FI-T304rrS24CsTZMXBMLDGSnP_QUn8kRSIgLGJqAhi1BopUPwBmAdeZJrGvqao9-xRTwoJA2I6LhkzUkbSfDOHERQLjpQevQZ6L3ehruvCusWVAu07_dLAqsnHhFsb2hWlgtTozvT64gwPuydvigesj7P7p7nmvcOx5o3v85s92m7NrR-0clA"
            />
          </div>
          <div className="max-w-sm text-center">
            <h3 className="mb-2 text-xl font-bold">No documents yet</h3>
            <p className="mb-8 text-slate-500 dark:text-slate-400">
              Upload your first PDF, Word file, or text document to start extracting insights with AI.
            </p>
            <button
              className="w-full rounded-xl bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 sm:w-auto"
              type="button"
            >
              Start Uploading
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Chats</h2>
          <Link className="font-medium text-primary hover:underline" to="/app/chat">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-6 py-16 dark:border-primary/10 dark:bg-primary/5 md:col-span-2">
            <div className="mb-6 rounded-full bg-primary/10 p-4 text-primary">
              <span className="material-symbols-outlined !text-5xl">forum</span>
            </div>
            <div className="max-w-sm text-center">
              <h3 className="mb-1 text-lg font-bold">Silence is golden, but…</h3>
              <p className="mb-6 text-slate-500 dark:text-slate-400">
                Your chat history is empty. Ask DocuMind AI anything about your documents to start a conversation.
              </p>
              <Link
                className="mx-auto flex w-fit items-center gap-2 rounded-xl border-2 border-primary px-6 py-2 font-bold text-primary transition-all hover:bg-primary hover:text-white"
                to="/app/chat"
              >
                <span className="material-symbols-outlined">add_comment</span>
                New Chat
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-6 dark:bg-primary/20">
              <h4 className="mb-3 flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-primary">lightbulb</span>
                Quick Tips
              </h4>
              <ul className="flex flex-col gap-4 text-sm">
                {[
                  'Ask for summaries of long research papers.',
                  'Compare key findings across multiple documents.',
                  'Generate study guides from your lecture notes.',
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-lg text-primary">check_circle</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

