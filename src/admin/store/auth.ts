import { create } from 'zustand'
import { signOut } from 'firebase/auth'
import { auth } from '../../shared/lib/firebase'
import { ADMIN_TOKEN_KEY, clearAdminToken, getStoredAdminToken } from '../lib/token'

interface AuthStore {
  token: string | null
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>(set => ({
  token: getStoredAdminToken(),
  setToken: token => {
    const trimmed = token?.trim()
    if (!trimmed) return
    localStorage.setItem(ADMIN_TOKEN_KEY, trimmed)
    set({ token: trimmed })
  },
  logout: () => {
    signOut(auth).catch(() => {})
    clearAdminToken()
    set({ token: null })
  },
}))
