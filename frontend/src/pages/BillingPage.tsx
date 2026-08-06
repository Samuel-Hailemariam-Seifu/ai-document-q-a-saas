import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createCheckoutSession, createPortalSession, getSubscription, type Subscription } from '../services/billing'
import { useWorkspaces } from '../workspaces/WorkspaceContext'
import { Icon } from '../components/common/Icon'
import { PageHeader } from '../components/layout/PageHeader'
import { formatDate } from '../lib/format'

const PRO_FEATURES = [
  'Higher limits for documents and questions',
  'Faster background ingestion',
  'Priority model access',
]

function planFor(status: string): { label: string; badgeClass: string; isPro: boolean } {
  if (status === 'active' || status === 'trialing') {
    return {
      label: 'Pro',
      badgeClass: 'bg-primary/10 text-primary dark:text-primary-dark',
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
    badgeClass: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    isPro: false,
  }
}

export function BillingPage() {
  const { state } = useWorkspaces()
  const [searchParams] = useSearchParams()
  const workspaceId = state.status === 'ready' ? state.activeWorkspaceId : null

  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const statusBanner = searchParams.get('status')

  const refresh = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      setSub(await getSubscription(workspaceId))
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
        <Icon name="workspaces" size={24} className="text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Select a workspace first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage the subscription for this workspace."
        actions={
          <button type="button" className="saas-btn saas-btn-secondary" onClick={() => void refresh()} disabled={busy}>
            <Icon name="refresh" size={16} className={loading ? 'animate-spin' : undefined} />
            Refresh
          </button>
        }
      />

      {statusBanner === 'success' ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Icon name="check" size={16} className="mt-0.5 shrink-0" />
          Subscription updated successfully.
        </div>
      ) : statusBanner === 'cancel' ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" />
          Checkout canceled.
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="saas-card p-5 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="saas-label">Current plan</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="saas-stat">{plan.label}</span>
                <span className={`saas-badge ${plan.badgeClass}`}>{sub?.status ?? 'inactive'}</span>
              </div>
              {sub?.current_period_end ? (
                <p className="saas-meta mt-2">Renews {formatDate(sub.current_period_end)}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {plan.isPro ? null : (
                <button
                  type="button"
                  className="saas-btn saas-btn-primary"
                  disabled={busy}
                  onClick={() => void startCheckout()}
                >
                  <Icon name="crown" size={16} />
                  Upgrade to Pro
                </button>
              )}
              <button
                type="button"
                className="saas-btn saas-btn-secondary"
                disabled={busy}
                onClick={() => void openPortal()}
              >
                Manage billing
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="saas-card p-5 sm:p-6">
          <h2 className="saas-section-title">Pro includes</h2>
          <ul className="mt-4 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-primary dark:text-primary-dark" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="saas-card p-5 sm:p-6">
          <h2 className="saas-section-title">Good to know</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Plan status is kept in sync through Stripe webhooks. If you just upgraded and still see the old plan, wait a
            few seconds and hit Refresh.
          </p>
        </div>
      </div>
    </div>
  )
}
