/**
 * Dual auth mode resolution — DEV JWT vs Telegram Mini App.
 *
 * Mode A (dev-jwt): VITE_DEV_ACCESS_TOKEN set in a DEV build → JWT only, no Telegram bootstrap.
 * Mode B (telegram): everything else → full Telegram initData flow (production + real Mini App).
 */

export type AuthMode = 'dev-jwt' | 'telegram'

export function getDevAccessToken(): string | undefined {
  if (!import.meta.env.DEV) return undefined
  const value = import.meta.env.VITE_DEV_ACCESS_TOKEN
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** Which auth path AuthProvider and API bootstrap should use. */
export function resolveAuthMode(): AuthMode {
  if (getDevAccessToken()) return 'dev-jwt'
  return 'telegram'
}

export function isDevJwtAuthMode(): boolean {
  return resolveAuthMode() === 'dev-jwt'
}

export function isTelegramAuthMode(): boolean {
  return resolveAuthMode() === 'telegram'
}
