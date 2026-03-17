import { getStoredTokens, setStoredTokens, type TokenPair } from '../auth/tokens'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8000'

type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'

type ApiError = {
  status: number
  message: string
}

async function parseError(res: Response): Promise<ApiError> {
  const status = res.status
  try {
    const data = (await res.json()) as { detail?: unknown }
    if (typeof data?.detail === 'string') return { status, message: data.detail }
    return { status, message: 'Request failed' }
  } catch {
    return { status, message: 'Request failed' }
  }
}

async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw await parseError(res)
  return (await res.json()) as TokenPair
}

export async function apiRequest<TResponse>(
  path: string,
  opts?: {
    method?: HttpMethod
    body?: unknown
    auth?: boolean
    signal?: AbortSignal
  },
): Promise<TResponse> {
  const method = opts?.method ?? 'GET'
  const auth = opts?.auth ?? true
  const tokens = getStoredTokens()

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  let body: string | undefined
  if (opts?.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  if (auth && tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`
  }

  const doFetch = async () =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body,
      signal: opts?.signal,
    })

  let res = await doFetch()

  if (auth && res.status === 401 && tokens?.refreshToken) {
    try {
      const next = await refreshTokens(tokens.refreshToken)
      setStoredTokens(next)
      headers.Authorization = `Bearer ${next.access_token}`
      res = await doFetch()
    } catch {
      // If refresh fails, the caller can force logout via auth state.
    }
  }

  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as TResponse
  return (await res.json()) as TResponse
}

