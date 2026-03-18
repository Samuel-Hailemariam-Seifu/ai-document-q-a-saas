import { apiRequest } from '../lib/api'

export type Chat = {
  id: number
  workspace_id: number
  title: string
  created_at: string
}

export type ChatPreview = {
  id: number
  workspace_id: number
  title: string
  last_message_preview: string | null
  last_message_at: string | null
}

export type Citation = {
  document_id: number
  filename: string
  chunk_id: number
  page_number: number | null
  excerpt: string
}

export type Message = {
  id: number
  chat_id: number
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[] | null
  created_at: string
}

export async function listChats(workspaceId: number): Promise<Chat[]> {
  return apiRequest<Chat[]>(`/api/workspaces/${workspaceId}/chats`, { method: 'GET', auth: true })
}

export async function listRecentChats(workspaceId: number, limit = 6): Promise<ChatPreview[]> {
  const lim = Math.max(1, Math.min(20, Math.floor(limit)))
  return apiRequest<ChatPreview[]>(`/api/workspaces/${workspaceId}/chats/recent?limit=${lim}`, {
    method: 'GET',
    auth: true,
  })
}

export async function createChat(workspaceId: number, title?: string): Promise<Chat> {
  return apiRequest<Chat>(`/api/workspaces/${workspaceId}/chats`, {
    method: 'POST',
    auth: true,
    body: { title: title ?? null },
  })
}

export async function listMessages(chatId: number, workspaceId: number): Promise<Message[]> {
  return apiRequest<Message[]>(`/api/chats/${chatId}/messages?workspace_id=${workspaceId}`, {
    method: 'GET',
    auth: true,
  })
}

export async function deleteChat(chatId: number, workspaceId: number): Promise<void> {
  await apiRequest<void>(`/api/chats/${chatId}?workspace_id=${workspaceId}`, {
    method: 'DELETE',
    auth: true,
  })
}

export async function askQuestion(
  workspaceId: number,
  question: string,
  chatId?: number | null,
  documentIds?: number[] | null,
): Promise<{ chat_id: number; answer: string; citations: Citation[] }> {
  const cleanedDocumentIds =
    documentIds?.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0) ?? []
  try {
    return await apiRequest(`/api/workspaces/${workspaceId}/chat`, {
      method: 'POST',
      auth: true,
      body: { question, chat_id: chatId ?? null, document_ids: cleanedDocumentIds.length ? cleanedDocumentIds : null },
    })
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    // Backward compatibility: old backend may reject the new field.
    if ((status === 400 || status === 422) && cleanedDocumentIds.length > 0) {
      return apiRequest(`/api/workspaces/${workspaceId}/chat`, {
        method: 'POST',
        auth: true,
        body: { question, chat_id: chatId ?? null },
      })
    }
    throw error
  }
}

