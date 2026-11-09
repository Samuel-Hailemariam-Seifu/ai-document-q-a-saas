import { getWorkspaceStats, type WorkspaceStats } from './workspaces'
import { FREE_PLAN_LIMITS, limitsForPlan, type PlanId } from '../lib/planLimits'
import { getSubscription } from './billing'

/**
 * Provider-agnostic usage snapshot for UI meters.
 * Until a dedicated usage endpoint exists, we derive counts from workspace stats
 * and compare against local plan limit constants.
 */
export type UsageSnapshot = {
  plan: PlanId
  documentsUsed: number
  documentsLimit: number
  questionsUsed: number
  questionsLimit: number
  storageUsedBytes: number
  storageLimitBytes: number
  /** True when values are approximate (no dedicated metering API). */
  approximate: boolean
}

function planFromSubscriptionStatus(status: string | undefined): PlanId {
  if (status === 'active' || status === 'trialing') return 'pro'
  return 'free'
}

export function usageFromStats(stats: WorkspaceStats, plan: PlanId = 'free'): UsageSnapshot {
  const limits = limitsForPlan(plan)
  return {
    plan,
    documentsUsed: stats.documents_total,
    documentsLimit: limits.documents,
    questionsUsed: stats.ai_queries_total,
    questionsLimit: limits.questionsPerMonth,
    storageUsedBytes: stats.storage_bytes_total,
    storageLimitBytes: limits.storageBytes,
    approximate: true,
  }
}

export async function getUsageSnapshot(workspaceId: number): Promise<UsageSnapshot> {
  const [stats, sub] = await Promise.all([
    getWorkspaceStats(workspaceId),
    getSubscription(workspaceId).catch(() => null),
  ])
  const plan = planFromSubscriptionStatus(sub?.status)
  return usageFromStats(stats, plan)
}

export function atDocumentLimit(usage: UsageSnapshot): boolean {
  return usage.documentsUsed >= usage.documentsLimit
}

export function atQuestionLimit(usage: UsageSnapshot): boolean {
  return usage.questionsUsed >= usage.questionsLimit
}

export { FREE_PLAN_LIMITS }
