import { apiRequest } from '../lib/api'
import { setStoredTokens, type TokenPair } from '../auth/tokens'

export type User = {
  id: number
  full_name: string
  email: string
}

export async function register(input: {
  full_name: string
  email: string
  password: string
}): Promise<TokenPair> {
  const pair = await apiRequest<TokenPair>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: input,
  })
  setStoredTokens(pair)
  return pair
}

export async function login(input: {
  email: string
  password: string
}): Promise<TokenPair> {
  const pair = await apiRequest<TokenPair>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: input,
  })
  setStoredTokens(pair)
  return pair
}

export async function me(): Promise<User> {
  return apiRequest<User>('/api/auth/me', { method: 'GET', auth: true })
}

