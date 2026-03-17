export type TokenPair = {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

const STORAGE_KEY = 'documind.auth'

type StoredTokens = {
  accessToken: string
  refreshToken: string
}

export function getStoredTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredTokens>
    if (!parsed.accessToken || !parsed.refreshToken) return null
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
  } catch {
    return null
  }
}

export function setStoredTokens(pair: TokenPair) {
  const payload: StoredTokens = {
    accessToken: pair.access_token,
    refreshToken: pair.refresh_token,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearStoredTokens() {
  localStorage.removeItem(STORAGE_KEY)
}

