import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background-light/80 backdrop-blur-md dark:bg-background-dark/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
                <span className="material-symbols-outlined text-xl">
                  auto_awesome
                </span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                DocuMind AI
              </span>
            </div>
            <nav className="hidden items-center gap-8 md:flex">
              <a
                className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-primary"
                href="#features"
              >
                Features
              </a>
              <a
                className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-primary"
                href="#how-it-works"
              >
                How it Works
              </a>
              <a
                className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-primary"
                href="#pricing"
              >
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="hidden px-4 py-2 text-sm font-semibold text-slate-900 hover:opacity-80 dark:text-white sm:block"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="relative pb-16 pt-20 lg:pb-24 lg:pt-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="flex flex-col gap-8">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
                  Now supporting GPT-4o
                </div>
                <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white lg:text-7xl">
                  Turn Your Documents Into an{' '}
                  <span className="text-primary">AI Assistant</span>
                </h1>
                <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400 lg:text-xl">
                  Upload PDFs, reports, or research papers and let DocuMind AI
                  answer your questions with precise citations in seconds.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/signup"
                    className="h-14 rounded-xl bg-primary px-8 text-lg font-bold text-white shadow-xl shadow-primary/25 transition-transform hover:scale-105 inline-flex items-center justify-center"
                  >
                    Start for Free
                  </Link>
                  <button
                    className="flex h-14 items-center gap-2 rounded-xl border border-primary/20 px-8 text-lg font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    type="button"
                  >
                    <span className="material-symbols-outlined">
                      play_circle
                    </span>
                    Watch Demo
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex -space-x-2">
                    <div
                      className="h-8 w-8 rounded-full border-2 border-background-dark bg-slate-200 dark:bg-slate-800"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKlBmMHElHtwhK05b1VtznQtn9IWUbeegmd8mh_XjefXF2-38MKZ60umUhTN85S9NarenmrXQJmyk_f5iRHL-GtDwhJCzBKPNjJjIgbeMRryI2SYKNBKe1qWaBO3tmkLvhye2koaeExLXphSerABb2yNKNQdCN4rd1iIx5B5JHZO2vponY64ztaRkHp29WaYIUSeEligl_k5dNB3apC8wW-htt6_NLOe6uaZdhRDHK6iTgnomaYuz91d42KWmTTAiGmXJGP6bzCYjy')",
                      }}
                    />
                    <div
                      className="h-8 w-8 rounded-full border-2 border-background-dark bg-slate-200 dark:bg-slate-800"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCTqUEjR2NZmPzN3nAAM7F8c5j2QWoovKxZ63n-I0wZG1eJ6iOJTIeGsRt4r0faM4hPgsgJIfQTRSkyDhUtf__HKHCeHOinjWbTNlh7chGT-V13WUYJ5dYb2v6qOpZwZACdcS0zZpOCGeU0vjuTG3q-7LBlHNWKewZ0MLU5gjarCS9uny5TKf_hV0dquaHoTIStR5iKgN4M0lkqG2KWgJoeW76PWg1FDyeWYgzjZcm2yWKfHNmAyoZx8rVM6hu0dTYTUPGvYYH569zl')",
                      }}
                    />
                    <div
                      className="h-8 w-8 rounded-full border-2 border-background-dark bg-slate-200 dark:bg-slate-800"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBwEeuprsD5Be06iDdhNgQsroTEaI-VDoMOWR76zBf_dH1ELIwXoAO0HTfnnIm0ElIYVHeChJYWvKxodytnSOtJm3wNhUTOWD5eLkIdK60sccqhNzzd1ZJ1jYfD2dFw86B-Qto1Y2uQ0ThaVd11wwDMOPQbA3v6_fB5_oA8tJkJh0a25aQa5a2H4kR0KOWxvrA_jf-GE_lzOgbIXgk0RNxxsy2__SOyyJXvTCMZJDIg2JV07FLYoMg_K2PVFHV5THT-2_DyQiO-3_l3')",
                      }}
                    />
                  </div>
                  <span>Trusted by 10,000+ researchers and students</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-primary to-emerald-600 opacity-20 blur-3xl" />
                <div className="relative rounded-2xl border border-primary/20 bg-slate-100 p-2 shadow-2xl dark:bg-slate-900">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                    <img
                      alt="Dashboard Preview"
                      className="h-full w-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuABPHUT3lubVhGO5sk8K5g2BWweZxO_6b31tS08yX0R9ynnMiMRSVNx2PGIpbAYTs_mly7uluP3CeJqBb-P2u8wA3ehDUTA5fw4ZxhthYIiid_6ZHucsATVNzhRqPbua3snkYu4v2BNPVSgytIod6Xfefigw-0wTftAb8XpWbk600RQxiqpo6ZsMoiQ5Y6nmUgIHczwP6afXA_MqxD18LKRYb-8JgPrdMpJCH0F1ytdMAjkcWFLdurRN4Dmb4n5I6hnZZQGJkODIHq_"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="bg-slate-50 py-24 dark:bg-slate-900/30"
          id="features"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white lg:text-4xl">
                Get Answers, Not Just Text
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                DocuMind AI processes your files to become a specialized
                knowledge base for your specific needs.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: 'forum',
                  title: 'Contextual AI Answers',
                  body: 'Ask questions in natural language and get human-like responses based solely on your files.',
                },
                {
                  icon: 'format_quote',
                  title: 'Smart Citations',
                  body: 'Every response includes direct links to source sentences, so you can verify info instantly.',
                },
                {
                  icon: 'security',
                  title: 'Secure & Private',
                  body: 'Your data is encrypted and never used to train public AI models. 100% private.',
                },
                {
                  icon: 'description',
                  title: 'Multi-format Support',
                  body: 'Upload PDFs, Word docs, TXT, or even scanned documents with our advanced OCR.',
                },
                {
                  icon: 'groups',
                  title: 'Team Collaboration',
                  body: 'Share your AI assistants with your team for collective intelligence and faster workflows.',
                },
                {
                  icon: 'api',
                  title: 'Custom AI Training',
                  body: 'Fine-tune how the AI interacts with your specific technical domain for higher accuracy.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-primary/10 bg-white p-8 shadow-sm transition-all hover:border-primary/40 dark:bg-background-dark"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">{f.icon}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24" id="pricing">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white lg:text-5xl">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Choose the plan that's right for your research needs.
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-8">
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                    Starter
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">
                      $0
                    </span>
                    <span className="text-slate-500">/mo</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">
                    For individuals getting started.
                  </p>
                </div>
                <ul className="mb-8 flex-grow space-y-4">
                  {['3 Documents', '50 Queries per month', 'Standard AI Model'].map(
                    (t) => (
                      <li
                        key={t}
                        className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-xl text-primary">
                          check_circle
                        </span>
                        {t}
                      </li>
                    ),
                  )}
                </ul>
                <Link
                  to="/signup"
                  className="w-full rounded-xl border border-primary px-4 py-3 text-center font-bold text-primary transition-colors hover:bg-primary/5"
                >
                  Get Started
                </Link>
              </div>

              <div className="relative flex transform flex-col rounded-2xl border-2 border-primary bg-slate-900 p-8 shadow-2xl dark:bg-background-dark lg:-translate-y-4">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                  Most Popular
                </div>
                <div className="mb-8">
                  <h3 className="mb-2 text-lg font-bold text-white">
                    Professional
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">$29</span>
                    <span className="text-slate-400">/mo</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-400">
                    For researchers and power users.
                  </p>
                </div>
                <ul className="mb-8 flex-grow space-y-4 text-white">
                  {[
                    'Unlimited Documents',
                    'Priority 24/7 Support',
                    'Advanced GPT-4o Citations',
                    'Custom AI Personality',
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-xl text-primary">
                        check_circle
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className="w-full rounded-xl bg-primary px-4 py-4 text-center font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110"
                >
                  Go Pro
                </Link>
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-8">
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                    Enterprise
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">
                      Custom
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">
                    For large teams and firms.
                  </p>
                </div>
                <ul className="mb-8 flex-grow space-y-4">
                  {['SSO Integration', 'On-premise Deployment', 'Custom API Access', 'Dedicated Account Manager'].map(
                    (t) => (
                      <li
                        key={t}
                        className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-xl text-primary">
                          check_circle
                        </span>
                        {t}
                      </li>
                    ),
                  )}
                </ul>
                <button
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                  type="button"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-2xl">
              <div className="absolute left-0 top-0 h-full w-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <div className="relative z-10 mx-auto max-w-3xl">
                <h2 className="mb-6 text-3xl font-black leading-tight text-white lg:text-5xl">
                  Ready to master your documents?
                </h2>
                <p className="mb-10 text-lg text-slate-200">
                  Join thousands of professionals who save 10+ hours a week with
                  DocuMind AI.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    to="/signup"
                    className="inline-flex h-14 items-center justify-center rounded-xl bg-white px-10 text-lg font-black text-primary shadow-xl transition-transform hover:scale-105"
                  >
                    Start Free Trial
                  </Link>
                  <button
                    className="h-14 rounded-xl border-2 border-white/20 px-10 text-lg font-bold text-white transition-colors hover:bg-white/10"
                    type="button"
                  >
                    Schedule a Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-background-light pb-8 pt-16 dark:border-slate-800 dark:bg-background-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
                  <span className="material-symbols-outlined text-xl">
                    auto_awesome
                  </span>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  DocuMind AI
                </span>
              </div>
              <p className="mb-6 max-w-sm text-slate-500 dark:text-slate-400">
                Building the future of document intelligence. Empowering
                researchers, lawyers, and students with contextual AI answers.
              </p>
              <div className="flex gap-4">
                <a
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:text-primary dark:border-slate-800"
                  href="#"
                >
                  <span className="material-symbols-outlined">public</span>
                </a>
                <a
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:text-primary dark:border-slate-800"
                  href="#"
                >
                  <span className="material-symbols-outlined">
                    alternate_email
                  </span>
                </a>
              </div>
            </div>
            {[
              {
                title: 'Product',
                items: ['Features', 'Pricing', 'API Docs', 'Changelog'],
              },
              { title: 'Company', items: ['About', 'Blog', 'Careers', 'Press Kit'] },
              {
                title: 'Legal',
                items: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 font-bold text-slate-900 dark:text-white">
                  {col.title}
                </h4>
                <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  {col.items.map((i) => (
                    <li key={i}>
                      <a className="transition-colors hover:text-primary" href="#">
                        {i}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 md:flex-row">
            <p>© 2024 DocuMind AI Inc. All rights reserved.</p>
            <p>Crafted for efficiency.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

