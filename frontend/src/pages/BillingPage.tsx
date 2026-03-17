import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createCheckoutSession, createPortalSession, getSubscription, type Subscription } from '../services/billing'
import { useWorkspaces } from '../workspaces/WorkspaceContext'

function planLabel(status: string): { label: string; tone: string } {
  if (status === 'active' || status === 'trialing') return { label: 'Pro', tone: 'text-emerald-600' }
  if (status === 'past_due') return { label: 'Past due', tone: 'text-amber-600' }
  if (status === 'canceled') return { label: 'Canceled', tone: 'text-rose-600' }
  return { label: 'Free', tone: 'text-slate-600 dark:text-slate-300' }
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
      const s = await getSubscription(workspaceId)
      setSub(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing status')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const plan = useMemo(() => planLabel(sub?.status ?? 'inactive'), [sub?.status])

  if (!workspaceId) {
    return <div className="text-slate-500">Select a workspace first.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your subscription for this workspace.
        </p>
      </div>

      {statusBanner === 'success' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          Subscription updated successfully.
        </div>
      ) : statusBanner === 'cancel' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          Checkout canceled.
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/5">
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-primary/10" />
        ) : error ? (
          <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>
        ) : (
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Current plan</p>
              <p className={['mt-2 text-3xl font-extrabold', plan.tone].join(' ')}>{plan.label}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Status: <span className="font-semibold">{sub?.status ?? 'inactive'}</span>
                {sub?.current_period_end ? (
                  <>
                    {' '}
                    • Renews:{' '}
                    <span className="font-semibold">
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const { url } = await createCheckoutSession(workspaceId)
                    window.location.href = url
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Upgrade to Pro
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const { url } = await createPortalSession(workspaceId)
                    window.location.href = url
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to open billing portal')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Manage billing
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-primary/20 dark:bg-background-dark dark:text-slate-200"
                onClick={refresh}
                disabled={busy}
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-primary/20 dark:bg-primary/5">
          <h3 className="text-sm font-extrabold">Pro includes</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Higher limits for documents and questions</li>
            <li>Faster background ingestion</li>
            <li>Priority model access</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-primary/20 dark:bg-primary/5">
          <h3 className="text-sm font-extrabold">Notes</h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Webhooks keep your plan status in sync. If you just upgraded and don’t see Pro yet, wait a few seconds and click Refresh.
          </p>
        </div>
      </div>
    </div>
  )
}

