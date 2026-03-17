import { apiRequest } from '../lib/api'

export type Chat = {
  id: number
  workspace_id: number
  title: string
  created_at: string
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

export async function askQuestion(
  workspaceId: number,
  question: string,
  chatId?: number | null,
): Promise<{ chat_id: number; answer: string; citations: Citation[] }> {
  return apiRequest(`/api/workspaces/${workspaceId}/chat`, {
    method: 'POST',
    auth: true,
    body: { question, chat_id: chatId ?? null },
  })
}

