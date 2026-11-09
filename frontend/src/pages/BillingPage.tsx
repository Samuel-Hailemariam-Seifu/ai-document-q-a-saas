import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { createCheckoutSession, createPortalSession, getSubscription, type Subscription } from '../services/billing'
import { getUsageSnapshot, type UsageSnapshot } from '../services/usage'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { Icon, type IconName } from '../components/common/Icon'
import { PageHeader } from '../components/layout/PageHeader'
import { formatBytes, formatDate, formatNumber } from '../lib/format'
import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from '../lib/planLimits'

function planFor(status: string): { label: string; badgeClass: string; isPro: boolean } {
  if (status === 'active' || status === 'trialing') {
    return {
      label: 'Pro',
      badgeClass: 'saas-badge-accent',
      isPro: true,
    }
  }
  if (status === 'past_due') {
    return {
      label: 'Past due',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
      isPro: false,
    }
  }
  if (status === 'canceled') {
    return {
      label: 'Canceled',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
      isPro: false,
    }
  }
  return {
    label: 'Free',
    badgeClass: 'saas-badge-neutral',
    isPro: false,
  }
}

function UsageCard({
  label,
  icon,
  used,
  limit,
  format,
}: {
  label: string
  icon: IconName
  used: number
  limit: number
  format: (n: number) => string
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const over = used >= limit
  const near = !over && pct >= 80
  return (
    <div className="saas-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-ui-sm text-content-muted">
          <Icon name={icon} size={14} className="text-content-faint" />
          {label}
        </span>
        <span
          className={[
            'tabular text-xs font-medium',
            over ? 'text-danger' : near ? 'text-warning' : 'text-content-muted',
          ].join(' ')}
        >
          {pct}%
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="saas-stat">{format(used)}</span>
        <span className="text-sm text-content-muted">of {format(limit)}</span>
      </p>
      <div className="saas-progress mt-4">
        <div
          className={[
            'h-full rounded-full transition-[width]',
            over ? 'bg-rose-500' : near ? 'bg-amber-500' : 'bg-[var(--accent)]',
          ].join(' ')}
          style={{ width: `${Math.max(pct, used > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  )
}

export function BillingPage() {
  const { state } = useWorkspaces()
  const [searchParams] = useSearchParams()
  const workspaceId = state.status === 'ready' ? state.activeWorkspaceId : null

  const [sub, setSub] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const statusBanner = searchParams.get('status')

  const refresh = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [subscription, snap] = await Promise.all([
        getSubscription(workspaceId),
        getUsageSnapshot(workspaceId),
      ])
      setSub(subscription)
      setUsage(snap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing status')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const plan = useMemo(() => planFor(sub?.status ?? 'inactive'), [sub?.status])

  const startCheckout = useCallback(async () => {
    if (!workspaceId) return
    setBusy(true)
    setError(null)
    try {
      const { url } = await createCheckoutSession(workspaceId)
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start checkout')
      setBusy(false)
    }
  }, [workspaceId])

  const openPortal = useCallback(async () => {
    if (!workspaceId) return
    setBusy(true)
    setError(null)
    try {
      const { url } = await createPortalSession(workspaceId)
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open billing portal')
      setBusy(false)
    }
  }, [workspaceId])

  if (!workspaceId) {
    return (
      <div className="saas-card flex flex-col items-center justify-center px-6 py-14 text-center">
        <Icon name="workspaces" size={24} className="text-content-muted" />
        <p className="mt-3 text-sm text-content-muted">Select a workspace first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing"
        description="Your plan, usage this period, and invoices for this workspace."
        actions={
          <button
            type="button"
            className="saas-btn saas-btn-secondary"
            onClick={() => void refresh()}
            disabled={busy}
            aria-label="Refresh"
            title="Refresh"
          >
            <Icon name="refresh" size={15} className={loading ? 'animate-spin' : undefined} />
            <span className="sm:hidden">Refresh</span>
          </button>
        }
      />

      {statusBanner === 'success' ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Icon name="check" size={16} className="mt-0.5 shrink-0" />
          Subscription updated successfully.
        </div>
      ) : statusBanner === 'cancel' ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" />
          Checkout canceled — you have not been charged.
        </div>
      ) : null}

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <span className="flex items-start gap-2">
            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
            {error}
          </span>
          <button type="button" className="saas-btn saas-btn-secondary saas-btn-sm" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      ) : null}

      {/* Current plan */}
      <section className="saas-card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            <div className="saas-skeleton h-4 w-24" />
            <div className="saas-skeleton h-8 w-40" />
            <div className="saas-skeleton h-4 w-64" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span
                className={[
                  'flex size-11 shrink-0 items-center justify-center rounded-xl',
                  plan.isPro
                    ? 'bg-gradient-to-br from-teal-400 to-teal-700 text-white shadow-raised'
                    : 'saas-icon-tile size-11',
                ].join(' ')}
              >
                <Icon name={plan.isPro ? 'crown' : 'layers'} size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-ui-sm text-content-muted">Current plan</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xl font-semibold tracking-tight text-content">{plan.label}</span>
                  <span className={`saas-badge capitalize ${plan.badgeClass}`}>
                    {(sub?.status ?? 'inactive').replace('_', ' ')}
                  </span>
                </div>
                <p className="saas-meta mt-1">
                  {sub?.current_period_end
                    ? `${sub.cancel_at_period_end ? 'Ends' : 'Renews'} on ${formatDate(sub.current_period_end)}`
                    : plan.isPro
                      ? '$29 / month'
                      : 'Free forever · upgrade any time for higher limits'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="saas-btn saas-btn-secondary"
                disabled={busy}
                onClick={() => void openPortal()}
              >
                {plan.isPro ? 'Change or cancel plan' : 'Manage billing'}
              </button>
              {plan.isPro ? null : (
                <button
                  type="button"
                  className="saas-btn saas-btn-primary"
                  disabled={busy}
                  onClick={() => void startCheckout()}
                >
                  <Icon name="sparkles" size={15} />
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Usage */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="saas-section-title">Usage</h2>
          {usage?.approximate ? (
            <span className="text-xs text-content-muted">Estimated from workspace activity</span>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loading || !usage ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="saas-card space-y-3 p-5">
                <div className="saas-skeleton h-4 w-24" />
                <div className="saas-skeleton h-7 w-20" />
                <div className="saas-skeleton h-1.5 w-full" />
              </div>
            ))
          ) : (
            <>
              <UsageCard
                label="Documents"
                icon="file"
                used={usage.documentsUsed}
                limit={usage.documentsLimit}
                format={formatNumber}
              />
              <UsageCard
                label="Questions this month"
                icon="sparkles"
                used={usage.questionsUsed}
                limit={usage.questionsLimit}
                format={formatNumber}
              />
              <UsageCard
                label="Storage"
                icon="layers"
                used={usage.storageUsedBytes}
                limit={usage.storageLimitBytes}
                format={formatBytes}
              />
            </>
          )}
        </div>
      </section>

      {/* Plans */}
      <section>
        <h2 className="saas-section-title mb-3">Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PlanCard
            name="Free"
            price="$0"
            blurb="For trying citation-backed Q&A on a few files."
            current={!plan.isPro}
            features={[
              `Up to ${formatNumber(FREE_PLAN_LIMITS.documents)} documents`,
              `${formatNumber(FREE_PLAN_LIMITS.questionsPerMonth)} questions / month`,
              `${formatBytes(FREE_PLAN_LIMITS.storageBytes)} storage`,
              'Standard retrieval & citations',
            ]}
          />
          <PlanCard
            name="Pro"
            price="$29"
            blurb="For teams that rely on their documents every day."
            current={plan.isPro}
            highlight
            features={[
              `Up to ${formatNumber(PRO_PLAN_LIMITS.documents)} documents`,
              `${formatNumber(PRO_PLAN_LIMITS.questionsPerMonth)} questions / month`,
              `${formatBytes(PRO_PLAN_LIMITS.storageBytes)} storage`,
              'Priority processing & higher throughput',
            ]}
            action={
              plan.isPro ? null : (
                <button
                  type="button"
                  className="saas-btn saas-btn-primary w-full"
                  disabled={busy}
                  onClick={() => void startCheckout()}
                >
                  Upgrade to Pro
                </button>
              )
            }
          />
        </div>
      </section>

      {/* Invoices */}
      <section className="saas-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="saas-icon-tile">
            <Icon name="billing" size={16} />
          </span>
          <div>
            <h2 className="text-sm font-medium text-content">Invoices & payment method</h2>
            <p className="saas-meta mt-0.5">
              Download receipts and update your card in the secure billing portal.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="saas-btn saas-btn-secondary shrink-0"
          disabled={busy}
          onClick={() => void openPortal()}
        >
          Open billing portal
          <Icon name="externalLink" size={14} />
        </button>
      </section>

      <p className="text-center text-xs text-content-muted">
        Questions about plans or invoices?{' '}
        <Link className="saas-link" to="/app/settings">
          Contact us from Settings
        </Link>
      </p>
    </div>
  )
}

function PlanCard({
  name,
  price,
  blurb,
  features,
  current,
  highlight,
  action,
}: {
  name: string
  price: string
  blurb: string
  features: string[]
  current: boolean
  highlight?: boolean
  action?: ReactNode
}) {
  return (
    <div
      className={[
        'relative flex flex-col rounded-xl border bg-surface-solid p-6',
        highlight ? 'border-[color-mix(in_srgb,var(--accent)_45%,transparent)] shadow-raised' : 'border-subtle shadow-soft',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-content">{name}</p>
        {current ? (
          <span className="saas-badge saas-badge-neutral">Current plan</span>
        ) : highlight ? (
          <span className="saas-badge saas-badge-accent">Recommended</span>
        ) : null}
      </div>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-content">{price}</span>
        <span className="text-sm text-content-muted">/ month</span>
      </p>
      <p className="saas-meta mt-1">{blurb}</p>
      <ul className="mt-5 flex-1 space-y-2.5 text-sm text-content-secondary">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Icon name="checkMark" size={15} className="mt-0.5 shrink-0 text-accent-text" />
            {f}
          </li>
        ))}
      </ul>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
