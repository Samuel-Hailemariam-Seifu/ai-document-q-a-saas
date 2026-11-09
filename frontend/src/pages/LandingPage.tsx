import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/brand/LogoMark'
import { Icon, type IconName } from '../components/common/Icon'
import { ThemeToggle } from '../components/theme/ThemeToggle'
import { PRODUCT_NAME } from '../lib/brand'
import { formatBytes, formatNumber } from '../lib/format'
import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from '../lib/planLimits'

const CONTACT_MAILTO = 'mailto:hello@example.com?subject=DocuMind%20Enterprise'

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative min-h-screen overflow-x-clip bg-surface-solid font-display text-content antialiased">
      {/* ------------------------------------------------------------ Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-subtle bg-surface-glass backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-2" aria-label={`${PRODUCT_NAME} home`}>
            <LogoMark size={26} className="shrink-0" />
            <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-content">{PRODUCT_NAME}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-sm text-content-muted transition-colors hover:text-content"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Link to="/login" className="saas-btn saas-btn-ghost saas-btn-sm hidden sm:inline-flex">
              Log in
            </Link>
            <Link to="/signup" className="saas-btn saas-btn-inverse saas-btn-sm hidden sm:inline-flex">
              Get started
            </Link>
            <button
              type="button"
              className="saas-icon-btn md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={18} />
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="animate-fade-in border-t border-subtle bg-surface-solid px-5 pb-5 pt-2 md:hidden">
            <nav className="flex flex-col" aria-label="Mobile">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-subtle py-3 text-sm text-content-secondary"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/login" className="saas-btn saas-btn-secondary">
                Log in
              </Link>
              <Link to="/signup" className="saas-btn saas-btn-inverse">
                Get started
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        {/* ------------------------------------------------------------ Hero */}
        <section className="relative">
          <div className="bg-dot-grid pointer-events-none absolute inset-x-0 top-0 h-[720px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]" />
          <div className="bg-hero-glow pointer-events-none absolute inset-x-0 top-0 h-[720px]" />

          <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface-solid py-1 pl-1 pr-3 text-xs text-content-secondary shadow-soft transition-colors hover:border-strong"
            >
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent-text">New</span>
              Hybrid keyword + semantic retrieval
              <Icon name="arrowRight" size={12} className="text-content-muted" />
            </a>

            <h1 className="mx-auto mt-6 max-w-3xl text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.04em] text-content text-balance sm:text-6xl lg:text-[4.25rem]">
              Ask your documents.
              <br className="hidden sm:block" />{' '}
              <span className="bg-gradient-to-br from-teal-500 to-teal-800 bg-clip-text text-transparent dark:from-teal-300 dark:to-teal-600">
                Trust every answer.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-content-muted text-balance sm:text-lg">
              Upload PDFs, Word docs and text files. {PRODUCT_NAME} answers in plain language and cites the exact
              passage behind every claim — so you can verify in one click.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="saas-btn saas-btn-primary saas-btn-lg w-full sm:w-auto">
                Start for free
                <Icon name="arrowRight" size={16} />
              </Link>
              <a href="#how-it-works" className="saas-btn saas-btn-secondary saas-btn-lg w-full sm:w-auto">
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-content-faint">Free plan · No credit card required</p>
          </div>

          {/* Product preview */}
          <div id="demo" className="relative mx-auto max-w-6xl scroll-mt-24 px-3 pb-20 sm:px-6">
            <div className="rounded-2xl border border-subtle bg-surface-muted/60 p-1.5 shadow-overlay sm:p-2">
              <ProductPreview />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ Formats strip */}
        <section className="border-y border-subtle bg-surface-canvas">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-sm text-content-muted sm:flex-row sm:px-6">
            <p>Works with the files your team already has</p>
            <div className="flex flex-wrap items-center gap-2">
              {['PDF', 'DOCX', 'TXT'].map((f) => (
                <span
                  key={f}
                  className="rounded-md border border-subtle bg-surface-solid px-2.5 py-1 font-mono text-xs font-medium text-content-secondary"
                >
                  .{f.toLowerCase()}
                </span>
              ))}
              <span className="text-xs text-content-faint">up to 25MB each</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ Features */}
        <section id="features" className="scroll-mt-16 px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Features"
              title="Built for answers you can defend"
              body="Every part of the pipeline — from ingestion to retrieval to the answer — is designed so you can see where information came from."
            />

            <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
              <FeatureCard
                className="md:col-span-2"
                icon="messageQuote"
                title="Every answer is cited"
                body="Numbered citations link each claim to the passage it came from. Open a source to see the highlighted text in context."
              >
                <div className="mt-6 space-y-2 rounded-xl border border-subtle bg-surface-muted/60 p-4 text-sm">
                  <p className="leading-relaxed text-content-secondary">
                    Approved refunds go back to the original payment method within{' '}
                    <span className="font-medium text-content">5–10 business days</span>
                    <Cite n={1} />.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <SourceChip n={1} label="refund_policy.pdf · §4.3" />
                    <SourceChip n={2} label="billing_faq.docx · p.1" />
                  </div>
                </div>
              </FeatureCard>

              <FeatureCard
                icon="search"
                title="Hybrid retrieval"
                body="Keyword and semantic search work together, so exact terms and paraphrased questions both find the right passage."
              />

              <FeatureCard
                icon="folderOpen"
                title="Scope your question"
                body="Pick exactly which documents to search — keep answers on-topic and out of unrelated files."
              />

              <FeatureCard
                className="md:col-span-2"
                icon="layers"
                title="Background ingestion"
                body="Uploads are chunked and embedded in the background. Track status for every file and retry failures in one click."
              >
                <div className="mt-6 divide-y divide-[var(--border-subtle)] rounded-xl border border-subtle bg-surface-solid text-sm">
                  {[
                    ['employee_handbook.pdf', 'Ready', 'text-emerald-600 dark:text-emerald-400'],
                    ['q3_vendor_contract.docx', 'Processing', 'text-amber-600 dark:text-amber-400'],
                    ['meeting_notes.txt', 'Ready', 'text-emerald-600 dark:text-emerald-400'],
                  ].map(([name, status, color]) => (
                    <div key={name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="truncate text-content-secondary">{name}</span>
                      <span className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${color}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </FeatureCard>

              <FeatureCard
                icon="workspaces"
                title="Workspaces"
                body="Separate documents, chats and billing per team or project. Switch in one click."
              />
              <FeatureCard
                icon="shield"
                title="Private by design"
                body="Access is gated by authentication and workspace membership. Only your workspace can query your files."
              />
              <FeatureCard
                icon="history"
                title="Chat history"
                body="Pick up any conversation where you left off, with its sources still attached."
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ How it works */}
        <section id="how-it-works" className="scroll-mt-16 border-y border-subtle bg-surface-canvas px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="How it works"
              title="From upload to verified answer in minutes"
              body="No setup, no prompt engineering. Drop in your files and start asking."
            />
            <ol className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['upload', 'Upload', 'Add PDFs, Word docs or text files to a workspace.'],
                ['layers', 'Index', 'We extract text, split it into passages and build embeddings.'],
                ['chat', 'Ask', 'Ask in plain language — optionally scoped to specific files.'],
                ['badgeCheck', 'Verify', 'Open each citation to see the exact source passage.'],
              ].map(([icon, title, body], i) => (
                <li key={title} className="saas-card relative p-6">
                  <div className="flex items-center justify-between">
                    <span className="saas-icon-tile-accent">
                      <Icon name={icon as IconName} size={17} />
                    </span>
                    <span className="font-mono text-xs text-content-faint">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[0.9375rem] font-semibold text-content">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-content-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------------ Pricing */}
        <section id="pricing" className="scroll-mt-16 px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Pricing"
              title="Simple pricing that scales with you"
              body="Start free. Upgrade when your team needs higher limits."
            />

            <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-3">
              <PriceCard
                name="Free"
                price="$0"
                cadence="/ month"
                blurb="For trying citation-backed Q&A."
                features={[
                  `${formatNumber(FREE_PLAN_LIMITS.documents)} documents`,
                  `${formatNumber(FREE_PLAN_LIMITS.questionsPerMonth)} questions / month`,
                  `${formatBytes(FREE_PLAN_LIMITS.storageBytes)} storage`,
                  'Citations & source viewer',
                ]}
                cta={
                  <Link to="/signup" className="saas-btn saas-btn-secondary w-full">
                    Get started
                  </Link>
                }
              />
              <PriceCard
                name="Pro"
                price="$29"
                cadence="/ month"
                blurb="For teams that rely on their documents daily."
                highlight
                features={[
                  `Up to ${formatNumber(PRO_PLAN_LIMITS.documents)} documents`,
                  `${formatNumber(PRO_PLAN_LIMITS.questionsPerMonth)} questions / month`,
                  `${formatBytes(PRO_PLAN_LIMITS.storageBytes)} storage`,
                  'Priority processing',
                  'Everything in Free',
                ]}
                cta={
                  <Link to="/signup" className="saas-btn saas-btn-primary w-full">
                    Start with Pro
                  </Link>
                }
              />
              <PriceCard
                name="Enterprise"
                price="Custom"
                blurb="For organizations with higher volume."
                features={['Custom limits', 'Volume pricing', 'Onboarding help', 'Dedicated contact']}
                cta={
                  <a href={CONTACT_MAILTO} className="saas-btn saas-btn-secondary w-full">
                    Contact sales
                  </a>
                }
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ FAQ */}
        <section id="faq" className="scroll-mt-16 border-t border-subtle px-5 py-24 sm:px-6">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-accent-text">FAQ</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-content">Questions, answered</h2>
              <p className="mt-3 text-sm leading-relaxed text-content-muted">
                Can’t find what you need?{' '}
                <a className="saas-link" href={CONTACT_MAILTO}>
                  Get in touch
                </a>
                .
              </p>
            </div>
            <div className="divide-y divide-[var(--border-subtle)] border-y border-subtle lg:col-span-2">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.9375rem] font-medium text-content">
                    {q}
                    <Icon
                      name="plus"
                      size={16}
                      className="shrink-0 text-content-muted transition-transform group-open:rotate-45"
                    />
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-content-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ CTA */}
        <section className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-zinc-950 px-6 py-20 text-center sm:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(20,184,166,0.35),transparent_70%)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-white text-balance sm:text-4xl">
                See a cited answer from your own files
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-zinc-400">
                Create a workspace, upload a document and verify your first answer in under five minutes.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/signup" className="saas-btn saas-btn-lg w-full bg-white text-zinc-900 hover:bg-zinc-100 sm:w-auto">
                  Start for free
                  <Icon name="arrowRight" size={16} />
                </Link>
                <Link
                  to="/login"
                  className="saas-btn saas-btn-lg w-full border border-white/15 text-white hover:bg-white/10 sm:w-auto"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------ Footer */}
      <footer className="px-5 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <LogoMark size={24} className="shrink-0" />
              <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-content">{PRODUCT_NAME}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-content-muted">
              Citation-first answers from your documents.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              ['Features', '#features'],
              ['How it works', '#how-it-works'],
              ['Pricing', '#pricing'],
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              ['FAQ', '#faq'],
              ['Contact', CONTACT_MAILTO],
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              ['Privacy', '/privacy'],
              ['Terms', '/terms'],
              ['Security', '/security'],
            ]}
          />
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-col justify-between gap-2 border-t border-subtle pt-6 text-xs text-content-faint sm:flex-row">
          <p>© {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

const FAQ: Array<[string, string]> = [
  [
    'What file types are supported?',
    'PDF, DOCX and plain-text files up to 25MB each. Scanned PDFs need selectable text to be indexed.',
  ],
  [
    'How do citations work?',
    'Each answer is generated only from passages retrieved from your documents. Numbered markers link to those passages, and you can open any source to see the highlighted text.',
  ],
  [
    'Who can see my documents?',
    'Documents belong to a workspace. Only authenticated members of that workspace can view or query them.',
  ],
  [
    'Can I limit a question to specific files?',
    'Yes. Choose the documents in scope from the chat composer and the assistant will only search those files.',
  ],
  [
    'What happens when I hit a plan limit?',
    'You can keep reading existing answers. Upgrade to Pro from Billing to raise document, question and storage limits.',
  ],
]

/* -------------------------------------------------------------------------- */

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-accent-text">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-content text-balance sm:text-4xl">{title}</h2>
      <p className="mt-4 leading-relaxed text-content-muted text-balance">{body}</p>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  body,
  className,
  children,
}: {
  icon: IconName
  title: string
  body: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={['saas-card p-6 transition-shadow hover:shadow-raised', className].filter(Boolean).join(' ')}>
      <span className="saas-icon-tile">
        <Icon name={icon} size={17} />
      </span>
      <h3 className="mt-5 text-[0.9375rem] font-semibold text-content">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-content-muted">{body}</p>
      {children}
    </div>
  )
}

function PriceCard({
  name,
  price,
  cadence,
  blurb,
  features,
  cta,
  highlight,
}: {
  name: string
  price: string
  cadence?: string
  blurb: string
  features: string[]
  cta: ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={[
        'relative flex flex-col rounded-2xl border bg-surface-solid p-7',
        highlight
          ? 'border-[color-mix(in_srgb,var(--accent)_50%,transparent)] shadow-overlay lg:-my-3 lg:py-10'
          : 'border-subtle shadow-soft',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-content">{name}</p>
        {highlight ? <span className="saas-badge saas-badge-accent">Most popular</span> : null}
      </div>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-[-0.03em] text-content">{price}</span>
        {cadence ? <span className="text-sm text-content-muted">{cadence}</span> : null}
      </p>
      <p className="mt-2 text-sm text-content-muted">{blurb}</p>
      <div className="mt-6">{cta}</div>
      <ul className="mt-7 space-y-3 border-t border-subtle pt-6 text-sm text-content-secondary">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Icon name="checkMark" size={15} className="mt-0.5 shrink-0 text-accent-text" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <p className="text-sm font-medium text-content">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-content-muted">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith('/') ? (
              <Link to={href} className="transition-colors hover:text-content">
                {label}
              </Link>
            ) : (
              <a href={href} className="transition-colors hover:text-content">
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Cite({ n }: { n: number }) {
  return (
    <sup className="ml-0.5 rounded bg-accent-soft px-1 font-mono text-[10px] font-medium text-accent-text">{n}</sup>
  )
}

function SourceChip({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-subtle bg-surface-solid pl-1 pr-2.5 text-xs text-content-secondary">
      <span className="flex size-4 items-center justify-center rounded-full bg-accent-soft font-mono text-[9px] font-semibold text-accent-text">
        {n}
      </span>
      {label}
    </span>
  )
}

/** Static, illustrative mock of the app's chat screen. */
function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-subtle bg-surface-solid text-left" aria-hidden="true">
      {/* window chrome */}
      <div className="flex h-10 items-center gap-2 border-b border-subtle bg-surface-muted/60 px-4">
        <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="mx-auto hidden rounded-md border border-subtle bg-surface-solid px-16 py-0.5 text-[11px] text-content-faint sm:block">
          app.documind.ai/chat
        </span>
      </div>

      <div className="grid min-h-[420px] grid-cols-12">
        {/* sidebar */}
        <div className="col-span-3 hidden flex-col gap-1 border-r border-subtle bg-surface-canvas p-3 lg:flex">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-subtle bg-surface-solid px-2 py-1.5 text-xs font-medium text-content shadow-soft">
            <span className="flex size-5 items-center justify-center rounded bg-gradient-to-br from-teal-400 to-teal-600 text-[10px] text-white">
              A
            </span>
            Acme Legal
          </div>
          {['Overview', 'Assistant', 'Documents'].map((l, i) => (
            <div
              key={l}
              className={[
                'rounded-md px-2.5 py-1.5 text-xs',
                i === 1 ? 'bg-surface-solid font-medium text-content shadow-raised' : 'text-content-muted',
              ].join(' ')}
            >
              {l}
            </div>
          ))}
          <p className="mt-4 px-2.5 text-[11px] text-content-faint">Recent chats</p>
          {['Refund policy terms', 'Vendor SLA summary', 'PTO carry-over rules'].map((c) => (
            <div key={c} className="truncate rounded-md px-2.5 py-1.5 text-xs text-content-secondary">
              {c}
            </div>
          ))}
        </div>

        {/* conversation */}
        <div className="col-span-12 flex flex-col p-5 sm:p-8 md:col-span-8 lg:col-span-6">
          <div className="flex justify-end">
            <span className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-inverse px-4 py-2.5 text-sm text-content-inverse">
              How long do customers have to request a refund, and how do they do it?
            </span>
          </div>
          <div className="mt-6 flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 text-white">
              <Icon name="sparkles" size={14} />
            </span>
            <div className="min-w-0 text-sm leading-relaxed text-content-secondary">
              <p>
                Customers can request a refund within{' '}
                <span className="font-medium text-content">14 days of purchase</span>
                <Cite n={1} />, as long as usage stays within the plan’s fair-use limits
                <Cite n={2} />.
              </p>
              <p className="mt-3">
                To request one, they email billing with their account email and order ID. Approved refunds are
                returned within <span className="font-medium text-content">5–10 business days</span>
                <Cite n={1} />.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <SourceChip n={1} label="refund_policy.pdf" />
                <SourceChip n={2} label="terms_of_service.pdf" />
              </div>
            </div>
          </div>
          <div className="mt-auto pt-8">
            <div className="flex items-center justify-between rounded-2xl border border-strong bg-surface-solid px-4 py-3 shadow-raised">
              <span className="text-sm text-content-faint">Ask a follow-up…</span>
              <span className="flex size-7 items-center justify-center rounded-full bg-[var(--btn-primary-bg)] text-white">
                <Icon name="arrowUp" size={14} />
              </span>
            </div>
          </div>
        </div>

        {/* sources */}
        <div className="col-span-4 hidden flex-col gap-2 border-l border-subtle bg-surface-muted/40 p-4 md:flex lg:col-span-3">
          <p className="mb-1 text-xs font-medium text-content">Sources</p>
          <div className="rounded-xl border border-[var(--accent)] bg-surface-solid p-3 shadow-soft ring-[3px] ring-[color-mix(in_srgb,var(--accent)_14%,transparent)]">
            <div className="flex items-center gap-2 text-xs font-medium text-content">
              <span className="flex size-4 items-center justify-center rounded-full bg-accent-soft font-mono text-[9px] text-accent-text">
                1
              </span>
              refund_policy.pdf
            </div>
            <p className="mt-2 rounded-lg bg-surface-muted px-2.5 py-2 text-[11px] leading-relaxed text-content-secondary">
              4.2 Refund window — Refunds are available within{' '}
              <mark className="rounded bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-0.5 text-content">
                fourteen (14) days of purchase
              </mark>
              …
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface-solid p-3 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-medium text-content">
              <span className="flex size-4 items-center justify-center rounded-full bg-accent-soft font-mono text-[9px] text-accent-text">
                2
              </span>
              terms_of_service.pdf
            </div>
            <p className="mt-2 rounded-lg bg-surface-muted px-2.5 py-2 text-[11px] leading-relaxed text-content-secondary">
              3.1 Fair use — Plans include usage limits described in Section 3…
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
