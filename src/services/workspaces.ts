import { apiRequest } from '../lib/api'

export type Workspace = {
  id: number
  name: string
  created_at: string
}

export async function listWorkspaces(): Promise<Workspace[]> {
  return apiRequest<Workspace[]>('/api/workspaces', { method: 'GET', auth: true })
}

export async function createWorkspace(input: { name: string }): Promise<Workspace> {
  return apiRequest<Workspace>('/api/workspaces', {
    method: 'POST',
    auth: true,
    body: input,
  })
}

export async function getWorkspace(workspaceId: number): Promise<Workspace> {
  return apiRequest<Workspace>(`/api/workspaces/${workspaceId}`, { method: 'GET', auth: true })
}

