import { apiRequest } from '../lib/api'

export type Workspace = {
  id: number
  name: string
  created_at: string
}

export type WorkspaceStats = {
  workspace_id: number

  documents_total: number
  documents_ready: number
  documents_processing: number
  documents_pending: number
  documents_failed: number

  storage_bytes_total: number

  chats_total: number
  messages_total: number
  ai_queries_total: number

  ingestion_success_rate: number
  avg_processing_seconds: number | null
  citations_per_answer: number
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

export async function getWorkspaceStats(workspaceId: number): Promise<WorkspaceStats> {
  return apiRequest<WorkspaceStats>(`/api/workspaces/${workspaceId}/stats`, { method: 'GET', auth: true })
}

