import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, DeliveryType, Language, UserProfile } from '@/shared/types'

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
  setCart: (cart) => set({ cart: { ...cart, items_count: cart.items.reduce((s, i) => s + i.quantity, 0) } }),
  clearCart: () => set({ cart: null }),
}))

// ── Delivery type store ───────────────────────────────────────────────────

export interface SavedAddress {
  id: string
  type: 'home' | 'work' | 'other'
  title: string
  address: string
  details: string
}

interface DeliveryState {
  deliveryType: DeliveryType | null
  address: string
  savedAddresses: SavedAddress[]
  setDeliveryType: (type: DeliveryType | null) => void
  setAddress: (address: string) => void
  addAddress: (addr: Omit<SavedAddress, 'id'>) => void
  updateAddress: (id: string, addr: Omit<SavedAddress, 'id'>) => void
  removeAddress: (id: string) => void
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set) => ({
      deliveryType: null,
      address: '',
      savedAddresses: [
        {
          id: '1',
          type: 'home',
          title: 'Uy',
          address: 'Yunusobod tumani, 4-mavze, 23-uy, 45-xonadon',
          details: "Mo'ljal: Mega Planet orqasi",
        },
        {
          id: '2',
          type: 'work',
          title: 'Ish',
          address: "Mirobod tumani, Afrosiyob ko'chasi, 14-uy",
          details: "Mo'ljal: Oybek metrosi",
        },
        {
          id: '3',
          type: 'other',
          title: 'Ota-onamnikida',
          address: 'Chilonzor tumani, 8-mavze, 12-uy',
          details: '',
        }
      ],
      setDeliveryType: (deliveryType) => set({ deliveryType }),
      setAddress: (address) => set({ address }),
      addAddress: (addr) => set((state) => ({
        savedAddresses: [...state.savedAddresses, { ...addr, id: Math.random().toString(36).substring(2, 9) }]
      })),
      updateAddress: (id, addr) => set((state) => ({
        savedAddresses: state.savedAddresses.map(a => a.id === id ? { ...a, ...addr } : a)
      })),
      removeAddress: (id) => set((state) => ({
        savedAddresses: state.savedAddresses.filter(a => a.id !== id)
      })),
    }),
    {
      name: 'delivery',
      partialize: (state) => ({
        address:        state.address,
        savedAddresses: state.savedAddresses,
      }),
    }
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
      language: 'uz',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'lang' }
  )
)
