/**
 * Firestore API — drop-in замена для axios-based api/index.ts
 * Использует firestoreProducts, firestoreCart, firestoreOrders, firestoreUsers
 * Интерфейс намеренно повторяет productsApi / cartApi / ordersApi / usersApi
 * чтобы можно было переключить импорты без изменения страниц.
 */

import { firestoreCart, firestoreOrders, firestoreProducts, firestoreUsers } from '@/lib/firestore-service'
import type { Cart, DeliveryType, Language, Order, PaginatedOrders, Product, UserProfile } from '@/types'

// Telegram id текущего пользователя (должен быть установлен после авторизации)
let _currentTelegramId: number | null = null

export function setCurrentUser(telegramId: number) {
  _currentTelegramId = telegramId
}

function requireUser(): number {
  if (!_currentTelegramId) throw new Error('User not authenticated')
  return _currentTelegramId
}

// ── Products ──────────────────────────────────────────────────────────────

export const productsApi = {
  list: (): Promise<Product[]> =>
    firestoreProducts.list(),

  get: (id: number | string): Promise<Product> =>
    firestoreProducts.get(id).then(p => {
      if (!p) throw new Error(`Product ${id} not found`)
      return p
    }),
}

// ── Cart ──────────────────────────────────────────────────────────────────

export const cartApi = {
  get: (): Promise<Cart> =>
    firestoreCart.get(requireUser()),

  addItem: async (product_id: number | string, quantity = 1): Promise<Cart> => {
    const uid = requireUser()
    const product = await firestoreProducts.get(product_id)
    if (!product) throw new Error(`Product ${product_id} not found`)
    return firestoreCart.addItem(uid, product, quantity)
  },

  updateItem: (product_id: number | string, quantity: number): Promise<Cart> =>
    firestoreCart.updateItem(requireUser(), product_id, quantity),

  removeItem: (product_id: number | string): Promise<Cart> =>
    firestoreCart.removeItem(requireUser(), product_id),

  clear: (): Promise<void> =>
    firestoreCart.clear(requireUser()),
}

// ── Orders ────────────────────────────────────────────────────────────────

export const ordersApi = {
  create: async (params: {
    delivery_type: DeliveryType
    address?: string
    address_comment?: string
  }): Promise<Order> => {
    const uid = requireUser()
    const cart = await firestoreCart.get(uid)
    if (cart.items.length === 0) throw new Error('Cart is empty')
    return firestoreOrders.create(uid, cart, params)
  },

  list: async (opts?: { page?: number; size?: number }): Promise<PaginatedOrders> => {
    const items = await firestoreOrders.list(requireUser(), opts)
    return {
      items,
      meta: {
        page:        opts?.page ?? 1,
        size:        opts?.size ?? 20,
        total_count: items.length,
        has_next:    false,
        has_prev:    (opts?.page ?? 1) > 1,
      },
    }
  },

  get: (id: number | string): Promise<Order> =>
    firestoreOrders.get(String(id)).then(o => {
      if (!o) throw new Error(`Order ${id} not found`)
      return o
    }),

  subscribe: (onUpdate: (orders: Order[]) => void) =>
    firestoreOrders.subscribe(requireUser(), onUpdate),

  subscribeOne: (id: number | string, onUpdate: (order: Order | null) => void) =>
    firestoreOrders.subscribeOne(String(id), onUpdate),
}

// ── Users ─────────────────────────────────────────────────────────────────

export const usersApi = {
  me: (): Promise<UserProfile> =>
    firestoreUsers.get(requireUser()).then(u => {
      if (!u) throw new Error('User profile not found')
      return u
    }),

  update: async (data: { phone?: string; language?: Language }): Promise<UserProfile> => {
    const uid = requireUser()
    await firestoreUsers.upsert(uid, data)
    return firestoreUsers.get(uid).then(u => {
      if (!u) throw new Error('User profile not found')
      return u
    })
  },
}
