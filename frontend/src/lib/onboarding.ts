const KEY = 'documind.onboarding.completed'

export function isOnboardingComplete(workspaceId: number): boolean {
  try {
    const raw = localStorage.getItem(`${KEY}.${workspaceId}`)
    return raw === '1'
  } catch {
    return false
  }
}

export function markOnboardingComplete(workspaceId: number) {
  try {
    localStorage.setItem(`${KEY}.${workspaceId}`, '1')
  } catch {
    // ignore
  }
}
