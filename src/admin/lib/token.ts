export const ADMIN_TOKEN_KEY = 'admin_token'

export function getStoredAdminToken(): string | null {
  const raw = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (!raw || raw === 'undefined' || raw === 'null') {
    if (raw) localStorage.removeItem(ADMIN_TOKEN_KEY)
    return null
  }
  const token = raw.trim()
  return token.length > 0 ? token : null
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}
