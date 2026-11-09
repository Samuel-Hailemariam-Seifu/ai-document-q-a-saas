import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../brand/LogoMark'
import { Icon } from '../common/Icon'
import { PRODUCT_NAME } from '../../lib/brand'

/**
 * Split-screen auth layout: form on the left, product preview on the right
 * (large screens only). Used by login, signup and password flows.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-surface-solid font-display text-content">
      {/* Form column */}
      <div className="flex w-full flex-col px-6 py-6 sm:px-10 lg:w-[52%] lg:px-16">
        <Link to="/" className="flex w-fit items-center gap-2" aria-label={`${PRODUCT_NAME} home`}>
          <LogoMark size={26} className="shrink-0" />
          <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-content">{PRODUCT_NAME}</span>
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-content sm:text-[1.75rem]">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-content-muted">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-8 text-sm text-content-muted">{footer}</div> : null}
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-content-faint">
          <span>© {new Date().getFullYear()} {PRODUCT_NAME}</span>
          <Link className="transition-colors hover:text-content" to="/privacy">
            Privacy
          </Link>
          <Link className="transition-colors hover:text-content" to="/terms">
            Terms
          </Link>
          <Link className="transition-colors hover:text-content" to="/security">
            Security
          </Link>
        </nav>
      </div>

      {/* Preview column */}
      <aside className="relative hidden flex-1 overflow-hidden bg-zinc-950 p-3 lg:flex">
        <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_80%_60%_at_70%_0%,rgba(20,184,166,0.28),transparent_70%)] p-10 xl:p-14">
          <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-40 [--text-primary:#ffffff]" />

          <div className="relative max-w-md">
            <p className="text-sm font-medium text-teal-300">Citation-first document Q&amp;A</p>
            <p className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white xl:text-4xl text-balance">
              Answers you can trace back to the exact page.
            </p>
          </div>

          {/* Product preview */}
          <div className="relative my-10 rounded-xl border border-white/10 bg-zinc-900/80 p-5 shadow-2xl shadow-black/50 backdrop-blur">
            <div className="flex items-center justify-end">
              <span className="max-w-[80%] rounded-2xl rounded-br-md bg-white px-3.5 py-2 text-sm text-zinc-900">
                How long do customers have to request a refund?
              </span>
            </div>
            <div className="mt-4 flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 text-white">
                <Icon name="sparkles" size={14} />
              </span>
              <div className="min-w-0 text-sm leading-relaxed text-zinc-300">
                Refunds can be requested within <span className="font-medium text-white">14 days of purchase</span>
                <sup className="ml-0.5 rounded bg-teal-400/15 px-1 font-mono text-[10px] text-teal-300">1</sup>, provided usage
                stays within the plan’s fair-use limits
                <sup className="ml-0.5 rounded bg-teal-400/15 px-1 font-mono text-[10px] text-teal-300">2</sup>.
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['refund_policy.pdf · p.2', 'terms.pdf · §4.2'].map((src, i) => (
                    <span
                      key={src}
                      className="inline-flex h-6 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 pl-1 pr-2.5 text-xs text-zinc-300"
                    >
                      <span className="flex size-4 items-center justify-center rounded-full bg-teal-400/20 font-mono text-[9px] text-teal-300">
                        {i + 1}
                      </span>
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ul className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-6 text-sm">
            {[
              ['Grounded', 'Answers only from your files'],
              ['Cited', 'Every claim links to a passage'],
              ['Private', 'Workspace-scoped access'],
            ].map(([t, d]) => (
              <li key={t}>
                <p className="font-medium text-white">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
