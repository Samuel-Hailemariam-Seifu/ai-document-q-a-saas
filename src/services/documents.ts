import { apiRequest } from '../lib/api'

export type DocumentListItem = {
  id: number
  workspace_id: number
  original_name: string
  file_size: number
  status: string
  chunk_count: number
  created_at: string
}

export type DocumentDetail = DocumentListItem & {
  filename: string
  file_path: string
  mime_type: string
  page_count: number | null
  error_message: string | null
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem('documind.auth')
    if (!raw) return {}
    const { accessToken } = JSON.parse(raw) as { accessToken?: string }
    if (!accessToken) return {}
    return { Authorization: `Bearer ${accessToken}` }
  } catch {
    return {}
  }
}

export async function listDocuments(workspaceId: number): Promise<DocumentListItem[]> {
  return apiRequest<DocumentListItem[]>(
    `/api/workspaces/${workspaceId}/documents`,
    { method: 'GET', auth: true }
  )
}

export async function uploadDocument(
  workspaceId: number,
  file: File
): Promise<DocumentDetail> {
  const formData = new FormData()
  formData.append('file', file)
  const token = getAuthHeaders().Authorization
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/documents/upload`,
    {
      method: 'POST',
      headers: token ? { Authorization: token } : {},
      body: formData,
    }
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string }
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Upload failed')
  }
  return res.json() as Promise<DocumentDetail>
}

export async function getDocument(documentId: number): Promise<DocumentDetail> {
  return apiRequest<DocumentDetail>(`/api/documents/${documentId}`, {
    method: 'GET',
    auth: true,
  })
}

export async function deleteDocument(documentId: number): Promise<void> {
  return apiRequest<void>(`/api/documents/${documentId}`, {
    method: 'DELETE',
    auth: true,
  })
}
