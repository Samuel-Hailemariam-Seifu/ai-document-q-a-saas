import { Link } from 'react-router-dom'
import { LogoMark } from '../components/brand/LogoMark'

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background-light font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
      {/* Subtle background texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-background-light/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-background-dark/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark size={28} className="shrink-0" />
            <span className="font-heading text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              DocuMind AI
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              className="text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary"
              href="#features"
            >
              Features
            </a>
            <a
              className="text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary"
              href="#how-it-works"
            >
              How it works
            </a>
            <a
              className="text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary"
              href="#pricing"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-heading mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Document intelligence
            </p>
            <h1 className="font-heading text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
              Your documents.
              <br />
              <span className="text-primary">Answered.</span>
            </h1>
            <p className="mt-8 max-w-xl mx-auto text-lg text-slate-600 dark:text-slate-400">
              Upload PDFs and docs. Ask questions in plain language. Get accurate answers with citations—in seconds.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-white transition-all hover:opacity-90 sm:w-auto"
              >
                Start for free
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-8 py-4 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800/50 sm:w-auto"
              >
                See how it works
              </a>
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
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
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
              Three steps to document intelligence.
            </p>
            <div className="mt-16 grid gap-12 sm:grid-cols-3">
              {[
                { step: '01', title: 'Upload', text: 'Add PDFs, Word docs, or text files to your workspace.' },
                { step: '02', title: 'Process', text: 'We extract, chunk, and index your content securely.' },
                { step: '03', title: 'Ask', text: 'Chat with your documents and get cited answers in seconds.' },
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
          <div className="mx-auto max-w-3xl rounded-3xl bg-primary px-8 py-16 text-center text-white">
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
