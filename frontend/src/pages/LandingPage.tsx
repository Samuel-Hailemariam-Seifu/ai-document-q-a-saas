import { Link } from 'react-router-dom'
import { LogoMark } from '../components/brand/LogoMark'

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 font-display text-slate-100 antialiased">
      {/* Background grid */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.10) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark size={28} className="shrink-0" />
            <span className="font-heading text-lg font-semibold tracking-tight text-white">
              AI Document Q&amp;A Assistant
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              className="text-sm font-medium text-slate-300/80 transition-colors hover:text-white"
              href="#features"
            >
              Features
            </a>
            <a
              className="text-sm font-medium text-slate-300/80 transition-colors hover:text-white"
              href="#how-it-works"
            >
              How it works
            </a>
            <a
              className="text-sm font-medium text-slate-300/80 transition-colors hover:text-white"
              href="#pricing"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300/80 hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <p className="font-heading mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200/90">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-dark" />
                Private, citation-backed answers
              </p>
              <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
                Turn Your Documents Into an AI Assistant
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300/90 lg:mx-0">
                Upload PDFs, DOCX, or text files and ask questions with accurate, citation-backed answers powered by AI.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/signup"
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  Get Started
                </Link>
                <a
                  href="#demo"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white/90 shadow-sm shadow-black/20 transition-all hover:bg-white/10 sm:w-auto"
                >
                  View Demo
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: 'lock', text: 'Private & secure workspace' },
                  { icon: 'verified', text: 'Answers grounded in your documents' },
                  { icon: 'format_quote', text: 'Citations for every response' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/90 shadow-sm shadow-black/10 lg:justify-start"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary-dark">{item.icon}</span>
                    <span className="font-semibold">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clean UI mock (chat + document/citations panel) */}
            <div className="relative">
              <div
                id="demo"
                className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-dark">folder_data</span>
                    <p className="text-sm font-semibold text-white">Document panel</p>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary-dark">
                      Sources
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-300/80">Citations highlighted</span>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                  {/* Chat */}
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-white/5 ring-1 ring-white/10" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-300/70">
                          Question
                        </p>
                        <p className="mt-1 text-sm text-white">
                          What is the refund policy?
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-primary/20 ring-1 ring-primary/25" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-300/70">
                          AI answer
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-200">
                          Refunds are available within 14 days of purchase, as long as the service has not been used
                          beyond the plan’s fair-use limits. After 14 days, refunds are generally not provided.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary-dark ring-1 ring-primary/20">
                            <span className="material-symbols-outlined text-[16px] text-primary-dark">format_quote</span>
                            2 citations
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/15">
                            <span className="material-symbols-outlined text-[16px] text-slate-300">verified</span>
                            grounded
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Citations panel */}
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300/70">
                        Citations
                      </p>
                      <span className="text-xs font-semibold text-slate-300/70">Sources</span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {[
                        {
                          title: 'Terms.pdf',
                          meta: 'Section 4.2 • Chunk 18',
                          excerpt: 'Refunds are available within fourteen (14) days of purchase…',
                        },
                        {
                          title: 'Pricing.pdf',
                          meta: 'Section 2.1 • Chunk 6',
                          excerpt: 'After the 14-day period, refunds are generally not provided…',
                        },
                      ].map((c) => (
                        <div
                          key={`${c.title}-${c.meta}`}
                          className="rounded-lg border border-white/10 bg-white/5 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{c.title}</p>
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary-dark">
                              cited
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-300/70">{c.meta}</p>
                          <p className="mt-2 line-clamp-2 text-sm text-slate-200">
                            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 ring-1 ring-primary/15">
                              {c.excerpt}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-dark/40" id="features">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-16 text-center">
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Built for clarity
              </h2>
              <p className="mt-3 max-w-xl mx-auto text-slate-600 dark:text-slate-400">
                One place to query all your files—with answers you can trust.
              </p>
            </div>
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Ask in plain language',
                  description: 'No complex queries. Ask exactly as you would a colleague and get precise, cited answers.',
                  icon: 'forum',
                },
                {
                  title: 'Every answer cited',
                  description: 'Every response links back to the exact sentence in your document so you can verify instantly.',
                  icon: 'format_quote',
                },
                {
                  title: 'Private and secure',
                  description: 'Your data stays yours. Encrypted storage and never used to train public models.',
                  icon: 'security',
                },
              ].map((f) => (
                <div key={f.title} className="group">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-24" id="how-it-works">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-heading text-center text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-center text-slate-600 dark:text-slate-400">
              A workflow built for grounded answers.
            </p>
            <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: '01', title: 'Upload', text: 'Add PDFs, Word docs, or text files to a workspace.' },
                { step: '02', title: 'Ingest', text: 'We extract text, chunk it, and build embeddings for retrieval.' },
                { step: '03', title: 'Choose scope', text: 'Pick one or more papers to keep answers on-topic (docIds).' },
                { step: '04', title: 'Ask + verify', text: 'Get an answer plus citations you can click and confirm.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <span className="font-heading text-3xl font-bold text-primary/60">{item.step}</span>
                  <h3 className="font-heading mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-surface-dark/40" id="pricing">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Simple pricing
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                Start free. Upgrade when you need more.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-background-light p-8 dark:border-slate-700 dark:bg-background-dark">
                <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">Starter</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">$0</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">For getting started.</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {['3 documents', '50 queries/month', 'Standard AI'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary">check</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className="mt-8 block w-full rounded-full border border-primary py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  Get started
                </Link>
              </div>

              <div className="relative rounded-2xl border-2 border-primary bg-primary p-8 text-white shadow-xl shadow-primary/20">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-primary">
                  Popular
                </span>
                <h3 className="font-heading text-lg font-semibold">Pro</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$29</span>
                  <span className="text-white/80">/mo</span>
                </div>
                <p className="mt-2 text-sm text-white/80">For researchers and teams.</p>
                <ul className="mt-6 space-y-3 text-sm text-white/95">
                  {['Unlimited documents', 'Priority support', 'Advanced citations', 'Custom AI'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">check</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className="mt-8 block w-full rounded-full bg-white py-3 text-center text-sm font-semibold text-primary transition-opacity hover:opacity-90"
                >
                  Go Pro
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-background-light p-8 dark:border-slate-700 dark:bg-background-dark">
                <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">Enterprise</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">Custom</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">For large organizations.</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {['SSO', 'On-premise', 'Custom API', 'Dedicated support'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary">check</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-8 w-full rounded-full border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Contact sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-8 py-16 text-center text-white">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              Ready to get answers from your documents?
            </h2>
            <p className="mt-4 text-white/90">
              Join teams who save hours every week with DocuMind AI.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-base font-semibold text-primary transition-opacity hover:opacity-90"
            >
              Start free trial
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-background-light py-12 dark:border-slate-800 dark:bg-background-dark">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <LogoMark size={24} className="shrink-0" />
              <span className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
                DocuMind AI
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <a href="#features" className="hover:text-primary">Features</a>
              <a href="#pricing" className="hover:text-primary">Pricing</a>
              <a href="#" className="hover:text-primary">Privacy</a>
              <a href="#" className="hover:text-primary">Terms</a>
            </nav>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-500 md:text-left">
            © {new Date().getFullYear()} DocuMind AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
