/** Editable plan limits shown in product UI until a usage/billing API owns them. */
export const FREE_PLAN_LIMITS = {
  documents: 25,
  questionsPerMonth: 50,
  storageBytes: 100 * 1024 * 1024, // 100 MB
} as const

export const PRO_PLAN_LIMITS = {
  documents: 500,
  questionsPerMonth: 2_000,
  storageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
} as const

export type PlanId = 'free' | 'pro'

export function limitsForPlan(plan: PlanId) {
  return plan === 'pro' ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS
}
