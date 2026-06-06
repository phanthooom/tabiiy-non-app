import { collection, doc, getDocs, updateDoc, query, orderBy, limit, deleteDoc, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Order, Product, User, PaginatedList, CallDeliveryResult } from '../types/index'

export const authApi = {
  login: async (username: string, password: string) => {
    if (username === 'admin' && password === 'admin') {
      return { access_token: 'fake-admin-token', token_type: 'bearer' }
    }
    throw new Error('Неверный логин или пароль')
  },
}

import { onSnapshot } from 'firebase/firestore'

export const ordersApi = {
  subscribe: (
    onUpdate: (data: PaginatedList<Order>) => void,
    params?: { status?: string }
  ) => {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(100))
    return onSnapshot(q, (snap) => {
      let items = snap.docs.map(d => ({ ...d.data(), id: d.id } as any as Order))
      if (params?.status) {
        items = items.filter(o => o.status === params.status)
      }
      onUpdate({ items, total: items.length })
    })
  },
  list: async (params?: { status?: string; page?: number; size?: number }): Promise<PaginatedList<Order>> => {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(100))
    const snap = await getDocs(q)
    let items = snap.docs.map(d => ({ ...d.data(), id: d.id } as any as Order))
    if (params?.status) {
      items = items.filter(o => o.status === params.status)
    }
    return { items, total: items.length }
  },
  updateStatus: async (order: Order, status: string): Promise<Order> => {
    const ref = doc(db, 'orders', String(order.id))
    await updateDoc(ref, { status })
    
    // Вызываем нашу серверную функцию Vercel для отправки уведомления
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          telegramId: (order as any).user_id || order.user?.id, // Берем ID пользователя из заказа
          status,
          totalAmount: order.total_amount
        })
      })
    } catch (e) {
      console.error('Failed to call notify API', e)
    }

    return { ...order, status } as any as Order
  },
  callDelivery: async (_id: number | string): Promise<CallDeliveryResult> => {
    return { claim_id: 'dummy', price: 0 }
  },
  deliveryStatus: async (_id: number | string): Promise<unknown> => ({}),
  cancelDelivery: async (_id: number | string): Promise<unknown> => ({}),
}

export const productsApi = {
  list: async (): Promise<Product[]> => {
    const snap = await getDocs(collection(db, 'products'))
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as any as Product))
  },
  create: async (data: Partial<Product>): Promise<Product> => {
    const ref = await addDoc(collection(db, 'products'), data)
    return { ...data, id: ref.id } as any as Product
  },
  update: async (id: number | string, data: Partial<Product>): Promise<Product> => {
    await updateDoc(doc(db, 'products', String(id)), data)
    return { ...data, id } as any as Product
  },
  delete: async (id: number | string): Promise<void> => {
    await deleteDoc(doc(db, 'products', String(id)))
  },
}

export const usersApi = {
  list: async (_params?: { page?: number; size?: number }): Promise<PaginatedList<User>> => {
    const snap = await getDocs(collection(db, 'users'))
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as any as User))
    return { items, total: items.length }
  },
  deactivate: async (id: number | string): Promise<User> => {
    return { id } as any as User
  },
}
