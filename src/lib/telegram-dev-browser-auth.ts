/**
 * DEV ONLY — browser auth when Telegram `initData` is unavailable.
 * Used exclusively in DEV JWT mode (`VITE_DEV_ACCESS_TOKEN` present).
 * Never replaces production Mini App flow (`isTelegramAuthMode()`).
 */
import { cartApi, usersApi } from '@/api'
import { getDevAccessToken } from '@/lib/auth-mode'
import type { Cart, UserProfile } from '@/types'

export type DevBrowserAuthFailure = 'missing_credentials' | 'invalid_token'

export type DevBrowserAuthResult =
  | { ok: true; token: string; user: UserProfile; cart: Cart }
  | { ok: false; reason: DevBrowserAuthFailure }

export async function authenticateDevBrowser(
  existingToken: string | null,
): Promise<DevBrowserAuthResult> {
  if (!import.meta.env.DEV) {
    throw new Error('authenticateDevBrowser: only available in development')
  }

  const token = getDevAccessToken() ?? existingToken?.trim() ?? ''
  if (!token) {
    return { ok: false, reason: 'missing_credentials' }
  }

  localStorage.setItem('access_token', token)

  try {
    const user = await usersApi.me()
    const cart = await cartApi.get()
    return { ok: true, token, user, cart }
  } catch {
    return { ok: false, reason: 'invalid_token' }
  }
}
