/**
 * Firestore Service Layer
 * Полностью заменяет backend API для products, users, carts, orders.
 *
 * Структура коллекций:
 *   products/{productId}
 *   users/{telegramId}
 *   carts/{telegramId}
 *   orders/{orderId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Cart, CartItem, DeliveryType, Language, Order, OrderItem, Product, UserProfile } from '@/types'


// ── Helpers ───────────────────────────────────────────────────────────────

const col = {
  products: () => collection(db, 'products'),
  users:    () => collection(db, 'users'),
  carts:    () => collection(db, 'carts'),
  orders:   () => collection(db, 'orders'),
}

function toProduct(id: string, data: DocumentData): Product {
  const numId = Number(id)
  const finalId = Number.isNaN(numId) ? id : numId
  const descRu = data.description_ru ?? null
  const descUz = data.description_uz ?? null
  const imageUrl = data.image_url ?? null
  return {
    id:              finalId,
    name:            data.name_ru ?? data.name ?? '',
    name_ru:         data.name_ru ?? '',
    name_uz:         data.name_uz ?? '',
    price:           data.price ?? 0,
    quantity:        data.quantity ?? 0,
    photo_file_id:   data.photo_file_id ?? null,
    image_url:       imageUrl,
    is_available:    data.is_available ?? true,
    description:     descRu,
    description_ru:  descRu,
    description_uz:  descUz,
  }
}

function toUserProfile(telegramId: string, data: DocumentData): UserProfile {
  return {
    id:        Number(telegramId),
    full_name: data.full_name ?? '',
    username:  data.username ?? null,
    phone:     data.phone ?? null,
    language:  data.language ?? 'ru',
  }
}

function toOrder(id: string, data: DocumentData): Order {
  const numId = Number(id)
  return {
    id:              Number.isNaN(numId) ? id : numId,
    status:          data.status ?? 'accepted',
    status_label:    data.status_label ?? 'Принят',
    delivery_type:   data.delivery_type ?? 'pickup',
    address:         data.address ?? null,
    total_amount:    data.total_amount ?? 0,
    created_at:      data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    items:           data.items ?? [],
    yandex_claim_id: data.yandex_claim_id ?? null,
  }
}

// ── Products ──────────────────────────────────────────────────────────────

export const firestoreProducts = {
  /** Получить все доступные продукты */
  list: async (): Promise<Product[]> => {
    const snap = await getDocs(
      query(col.products(), where('is_available', '==', true))
    )
    return snap.docs.map(d => toProduct(d.id, d.data()))
  },

  /** Получить один продукт по ID */
  get: async (id: number | string): Promise<Product | null> => {
    const snap = await getDoc(doc(col.products(), String(id)))
    if (!snap.exists()) return null
    return toProduct(snap.id, snap.data())
  },

  /** Подписка на изменения каталога в реальном времени */
  subscribe: (onUpdate: (products: Product[]) => void): Unsubscribe => {
    const q = query(col.products(), where('is_available', '==', true))
    return onSnapshot(q, snap => {
      onUpdate(snap.docs.map(d => toProduct(d.id, d.data())))
    })
  },
}

// ── Users ─────────────────────────────────────────────────────────────────

export const firestoreUsers = {
  /** Получить профиль пользователя */
  get: async (telegramId: number): Promise<UserProfile | null> => {
    const snap = await getDoc(doc(db, 'users', String(telegramId)))
    if (!snap.exists()) return null
    return toUserProfile(snap.id, snap.data())
  },

  /** Создать или обновить профиль (upsert) */
  upsert: async (
    telegramId: number,
    data: Partial<Omit<UserProfile, 'id'>> & { fcm_token?: string }
  ): Promise<void> => {
    await setDoc(
      doc(db, 'users', String(telegramId)),
      { ...data, updated_at: serverTimestamp() },
      { merge: true }
    )
  },

  /** Обновить язык */
  setLanguage: async (telegramId: number, language: Language): Promise<void> => {
    await updateDoc(doc(db, 'users', String(telegramId)), { language })
  },

  /** Обновить телефон */
  setPhone: async (telegramId: number, phone: string): Promise<void> => {
    await updateDoc(doc(db, 'users', String(telegramId)), { phone })
  },

  /** Сохранить FCM токен для пуш-уведомлений */
  saveFcmToken: async (telegramId: number, token: string): Promise<void> => {
    await updateDoc(doc(db, 'users', String(telegramId)), {
      fcm_token: token,
      fcm_updated_at: serverTimestamp(),
    })
  },
}

// ── Cart ──────────────────────────────────────────────────────────────────

function calcCart(items: CartItem[]): Cart {
  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const items_count = items.reduce((s, i) => s + i.quantity, 0)
  return { items, total, items_count }
}

export const firestoreCart = {
  /** Получить корзину */
  get: async (telegramId: number): Promise<Cart> => {
    const snap = await getDoc(doc(db, 'carts', String(telegramId)))
    const items: CartItem[] = snap.exists() ? (snap.data().items ?? []) : []
    return calcCart(items)
  },

  /** Добавить товар (или увеличить количество) */
  addItem: async (telegramId: number, product: Product, quantity = 1): Promise<Cart> => {
    const ref = doc(db, 'carts', String(telegramId))
    const snap = await getDoc(ref)
    let items: CartItem[] = snap.exists() ? (snap.data().items ?? []) : []

    const existing = items.find(i => String(i.product_id) === String(product.id))
    if (existing) {
      existing.quantity += quantity
      existing.subtotal = existing.price * existing.quantity
    } else {
      items.push({
        product_id:   product.id,
        product_name: product.name_ru,
        price:        product.price,
        quantity,
        subtotal:     product.price * quantity,
        photo_file_id: product.photo_file_id,
        image_url:    product.image_url,
      })
    }

    await setDoc(ref, { items, updated_at: serverTimestamp() })
    return calcCart(items)
  },

  /** Изменить количество товара в корзине */
  updateItem: async (telegramId: number, product_id: number | string, quantity: number): Promise<Cart> => {
    const ref = doc(col.carts(), String(telegramId))
    const snap = await getDoc(ref)
    let items: CartItem[] = snap.exists() ? (snap.data().items ?? []) : []

    if (quantity <= 0) {
      items = items.filter(i => String(i.product_id) !== String(product_id))
    } else {
      const item = items.find(i => String(i.product_id) === String(product_id))
      if (item) {
        item.quantity = quantity
        item.subtotal = item.price * quantity
      }
    }

    await setDoc(ref, { items, updated_at: serverTimestamp() })
    return calcCart(items)
  },

  /** Удалить товар из корзины */
  removeItem: async (telegramId: number, productId: number | string): Promise<Cart> => {
    return firestoreCart.updateItem(telegramId, productId, 0)
  },

  /** Очистить корзину */
  clear: async (telegramId: number): Promise<void> => {
    await setDoc(doc(db, 'carts', String(telegramId)), {
      items: [],
      updated_at: serverTimestamp(),
    })
  },

  /** Подписка на корзину в реальном времени */
  subscribe: (telegramId: number, onUpdate: (cart: Cart) => void): Unsubscribe => {
    return onSnapshot(doc(db, 'carts', String(telegramId)), snap => {
      const items: CartItem[] = snap.exists() ? (snap.data().items ?? []) : []
      onUpdate(calcCart(items))
    })
  },
}

// ── Orders ────────────────────────────────────────────────────────────────

export const firestoreOrders = {
  /** Создать заказ */
  create: async (
    telegramId: number,
    cart: Cart,
    params: { delivery_type: DeliveryType; address?: string }
  ): Promise<Order> => {
    const items: OrderItem[] = cart.items.map(i => ({
      product_name: i.product_name,
      quantity:     i.quantity,
      unit_price:   i.price,
      subtotal:     i.subtotal,
    }))

    const userProfile = await firestoreUsers.get(telegramId)

    const orderData = {
      user_id:         String(telegramId),
      user_name:       userProfile?.full_name || 'Foydalanuvchi',
      user_phone:      userProfile?.phone || null,
      status:          'accepted',
      status_label:    'Принят',
      delivery_type:   params.delivery_type,
      address:         params.address ?? null,
      total_amount:    cart.total,
      items,
      yandex_claim_id: null,
      created_at:      serverTimestamp(),
      updated_at:      serverTimestamp(),
    }

    const ref = await addDoc(col.orders(), orderData)

    // Очищаем корзину после оформления
    await firestoreCart.clear(telegramId)

    return {
      ...orderData,
      id:         ref.id, // Использовать оригинальный ID Firestore
      created_at: new Date().toISOString(),
    }
  },

  /** Получить список заказов пользователя */
  list: async (
    telegramId: number,
    opts: { page?: number; size?: number } = {}
  ): Promise<Order[]> => {
    const constraints: QueryConstraint[] = [
      where('user_id', '==', String(telegramId)),
    ]
    const snap = await getDocs(query(col.orders(), ...constraints))
    const orders = snap.docs.map(d => toOrder(d.id, d.data()))
    // Sort in memory by created_at desc to avoid requiring a composite index in Firestore
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return orders.slice(0, opts.size ?? 20)
  },

  /** Получить один заказ */
  get: async (id: number | string): Promise<Order | null> => {
    const snap = await getDoc(doc(col.orders(), String(id)))
    if (!snap.exists()) return null
    return toOrder(snap.id, snap.data())
  },

  /** Подписка на заказы пользователя в реальном времени */
  subscribe: (telegramId: number, onUpdate: (orders: Order[]) => void): Unsubscribe => {
    const q = query(
      col.orders(),
      where('user_id', '==', String(telegramId))
    )
    return onSnapshot(q, snap => {
      const orders = snap.docs.map(d => toOrder(d.id, d.data()))
      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      onUpdate(orders.slice(0, 20))
    })
  },

  /** Подписка на один заказ (для отслеживания статуса) */
  subscribeOne: (orderId: string, onUpdate: (order: Order | null) => void): Unsubscribe => {
    return onSnapshot(doc(db, 'orders', orderId), snap => {
      onUpdate(snap.exists() ? toOrder(snap.id, snap.data()) : null)
    })
  },
}
