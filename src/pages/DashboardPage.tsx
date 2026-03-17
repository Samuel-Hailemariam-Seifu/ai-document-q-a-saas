import { Link } from 'react-router-dom'

export function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white dark:border-primary/20 dark:bg-background-dark">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">description</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">DocuMind AI</h2>
        </div>
        <nav className="mt-4 flex-1 space-y-2 px-4">
          <Link
            className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary"
            to="/app"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary/5"
            to="/app/empty"
          >
            <span className="material-symbols-outlined">folder</span>
            <span>Documents</span>
          </Link>
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary/5"
            to="/app/chat"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            <span>Chats</span>
          </Link>
          <a
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary/5"
            href="#"
          >
            <span className="material-symbols-outlined">analytics</span>
            <span>Insights</span>
          </a>
        </nav>
        <div className="border-t border-slate-200 p-4 dark:border-primary/20">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white transition-all hover:bg-primary/90"
            type="button"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Analysis</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/50 px-8 backdrop-blur-md dark:border-primary/20 dark:bg-background-dark/50">
          <div className="flex w-96 items-center gap-4 rounded-xl bg-slate-100 px-4 py-2 dark:bg-primary/10">
            <span className="material-symbols-outlined text-slate-400">
              search
            </span>
            <input
              className="w-full border-none bg-transparent text-sm focus:ring-0"
              placeholder="Search documents or queries..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-primary/10"
              type="button"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-primary/10"
              type="button"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-8 overflow-hidden rounded-full border border-primary/40 bg-primary/20">
              <img
                alt="Avatar"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAU0hDfOdCPuuO14tmQ1jJN_4xdCVrQUdCUyGrUjGm2JfBmddMPyywIrsIXH1LtItlEtLtjFQLY8yj2MupEVMXb_0ZB0RkZJvO42OZsQaO4DC1bw9Yl6RdpRKECAI6CCtI28msHr65yOqAcdSATHFBPtfh_Q92IYtVTgaxa52K_jElZdOXaibOUeN2QYTncIGZHIRNiP6C6vWyfms-bMKise2MaSwbF9G4FJZULRZhjQEVoXv5PfPszK0oLOCK3EcHDqM6xEgXwc51O"
              />
            </div>
          </div>
        </header>

        <div className="space-y-8 p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                label: 'Total Documents',
                value: '1,284',
                icon: 'description',
                sub: '+12.5% from last month',
              },
              { label: 'AI Queries', value: '42.5k', icon: 'bolt', sub: '+24.2% from last month' },
              { label: 'Storage Used', value: '84%', icon: 'cloud', sub: null },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {s.label}
                    </p>
                    <h3 className="mt-1 text-3xl font-bold">{s.value}</h3>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                </div>
                {s.sub ? (
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-500">
                    <span className="material-symbols-outlined text-xs">
                      trending_up
                    </span>
                    <span>{s.sub}</span>
                  </div>
                ) : (
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full w-[84%] bg-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center space-y-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center dark:border-primary/30 dark:bg-primary/5">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-3xl">
                upload_file
              </span>
            </div>
            <div>
              <h4 className="text-lg font-bold">Upload new documents</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Drag and drop your PDF, DOCX or TXT files here
              </p>
            </div>
            <button
              className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-white transition-all hover:bg-primary/90"
              type="button"
            >
              Browse Files
            </button>
            <p className="text-xs text-slate-400">
              Maximum file size: 25MB per document
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-primary/20 dark:bg-primary/5">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-primary/20">
              <h3 className="text-lg font-bold">Recent Documents</h3>
              <Link className="text-sm font-semibold text-primary hover:underline" to="/app/empty">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-primary/10 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Document Name</th>
                    <th className="px-6 py-4 font-semibold">Date Added</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-primary/20">
                  {[
                    { name: 'Q4_Financial_Report.pdf', size: '4.2 MB', date: 'Oct 24, 2023', status: 'Processed', badge: 'emerald' },
                    { name: 'Market_Analysis_2024.docx', size: '1.8 MB', date: 'Oct 23, 2023', status: 'Analyzing...', badge: 'amber' },
                    { name: 'Contract_Draft_v2.pdf', size: '850 KB', date: 'Oct 22, 2023', status: 'Processed', badge: 'emerald' },
                    { name: 'User_Onboarding.txt', size: '12 KB', date: 'Oct 21, 2023', status: 'Failed', badge: 'rose' },
                  ].map((d, idx) => (
                    <tr
                      key={d.name}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-primary/5"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">
                            {idx === 0
                              ? 'picture_as_pdf'
                              : idx === 1
                                ? 'description'
                                : idx === 2
                                  ? 'article'
                                  : 'feed'}
                          </span>
                          <div>
                            <p className="font-medium">{d.name}</p>
                            <p className="text-xs text-slate-500">{d.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {d.date}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={[
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            d.badge === 'emerald'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : d.badge === 'amber'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
                          ].join(' ')}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="p-2 text-slate-400 transition-colors hover:text-primary"
                          type="button"
                          aria-label="More"
                        >
                          <span className="material-symbols-outlined">
                            more_vert
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

