import { collection, doc, getDocs, updateDoc, query, orderBy, limit, deleteDoc, addDoc, onSnapshot } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '../../shared/lib/firebase'
import type { Order, Product, User, PaginatedList, CallDeliveryResult } from '../types/index'

export const authApi = {
  login: async (username: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, username, password)
    const token = await userCredential.user.getIdToken()
    return { access_token: token, token_type: 'bearer' }
  },
}

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
    const STATUS_LABELS: Record<string, string> = {
      accepted: '✅ Принят',
      packing: '📦 Упаковывается',
      courier_assigned: '🚗 Курьер в пути',
      delivered: '✅ Доставлен',
      cancelled: '❌ Отменён',
    }
    const statusText = STATUS_LABELS[status] || status
    await updateDoc(ref, { status, status_label: statusText })

    try {
      const telegramId = (order as any).user_id || order.user?.id || (order as any).customer_id
      const message = `📦 *Обновление заказа #${order.id}*\n\nСтатус вашего заказа изменён на: *${statusText}*\nСумма: ${order.total_amount} сум\n\nСпасибо, что выбираете Tabiiy Non! 🍞`
      
      const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN
      
      if (telegramId && BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: message,
            parse_mode: 'Markdown',
          })
        })
      }
    } catch (e) {
      console.error('Failed to send Telegram notification', e)
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
