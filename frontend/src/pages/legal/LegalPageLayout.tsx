import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../../components/brand/LogoMark'
import { Icon } from '../../components/common/Icon'
import { PRODUCT_NAME } from '../../lib/brand'

export function LegalPageLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-solid font-display text-content antialiased">
      <header className="saas-glass sticky top-0 z-40 border-b border-subtle">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark size={26} className="shrink-0" />
            <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-content">{PRODUCT_NAME}</span>
          </Link>
          <Link to="/" className="saas-btn saas-btn-ghost saas-btn-sm">
            <Icon name="arrowLeft" size={14} />
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium text-accent-text">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-content sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-content-muted">{description}</p>
        <div className="prose-saas mt-10 space-y-8 border-t border-subtle pt-10 text-sm leading-relaxed text-content-secondary">
          {children}
        </div>
        <p className="mt-12 rounded-lg border border-dashed border-subtle bg-surface-muted px-4 py-3 text-xs text-content-muted">
          TODO(legal): Replace placeholder copy with counsel-reviewed language before production launch.
        </p>
      </main>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold tracking-tight text-content">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}
