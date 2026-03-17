import { apiRequest } from '../lib/api'

export type Subscription = {
  workspace_id: number
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export async function getSubscription(workspaceId: number): Promise<Subscription> {
  return apiRequest<Subscription>(`/api/billing/workspaces/${workspaceId}`, { method: 'GET', auth: true })
}

export async function createCheckoutSession(workspaceId: number): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(`/api/billing/workspaces/${workspaceId}/checkout`, {
    method: 'POST',
    auth: true,
  })
}

export async function createPortalSession(workspaceId: number): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(`/api/billing/workspaces/${workspaceId}/portal`, {
    method: 'POST',
    auth: true,
  })
}

