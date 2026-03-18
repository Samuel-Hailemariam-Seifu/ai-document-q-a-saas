import { apiRequest } from '../lib/api'
import { setStoredTokens, type TokenPair } from '../auth/tokens'

export type User = {
  id: number
  full_name: string
  email: string
  email_verified: boolean
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

export async function requestVerification(email: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/api/auth/request-verification', {
    method: 'POST',
    auth: false,
    body: { email },
  })
}

export async function verifyEmail(token: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/api/auth/verify-email', {
    method: 'POST',
    auth: false,
    body: { token },
  })
}

export async function forgotPassword(email: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/api/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email },
  })
}

export async function resetPassword(token: string, newPassword: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/api/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: { token, new_password: newPassword },
  })
}

