import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, DeliveryType, Language, UserProfile } from '@/types'

// ── Auth store ────────────────────────────────────────────────────────────

interface AuthState {
  token: string | null
  user: UserProfile | null
  setAuth: (token: string, user: UserProfile) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('access_token', token)
        set({ token, user })
      },
      clear: () => {
        localStorage.removeItem('access_token')
        set({ token: null, user: null })
      },
    }),
    { name: 'auth' }
  )
)

// ── Cart store (local optimistic updates) ─────────────────────────────────

interface CartState {
  cart: Cart | null
  setCart: (cart: Cart) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()((set) => ({
  cart: null,
  setCart: (cart) => set({ cart }),
  clearCart: () => set({ cart: null }),
}))

// ── Delivery type store ───────────────────────────────────────────────────

interface DeliveryState {
  deliveryType: DeliveryType | null
  setDeliveryType: (type: DeliveryType | null) => void
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set) => ({
      deliveryType: null,
      setDeliveryType: (deliveryType) => set({ deliveryType }),
    }),
    { name: 'delivery' }
  )
)

// ── Language store ────────────────────────────────────────────────────────

interface LangState {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      language: 'ru',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'lang' }
  )
)
