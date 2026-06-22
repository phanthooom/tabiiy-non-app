import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { Order } from '@/shared/types'

// Convert Firestore document to Order type
function docToOrder(docSnap: any): Order {
  const data = docSnap.data()
  return {
    id: data.id || docSnap.id, // we might use integer IDs for UX, or just use string
    status: data.status || 'accepted',
    status_label: data.status_label || 'Accepted',
    delivery_type: data.delivery_type || 'delivery',
    address: data.address || null,
    total_amount: data.total_amount || 0,
    created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    items: data.items || [],
    yandex_claim_id: data.yandex_claim_id || null,
    telegram_id: data.telegram_id || null,
    user_name: data.user_name || null,
    user_phone: data.user_phone || null,
    _docId: docSnap.id
  } as Order & { _docId: string; telegram_id?: number; user_name?: string; user_phone?: string }
}

export function useFirebaseOrders(telegramId?: number | null) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(docToOrder)
      // Filter if telegramId is provided
      if (telegramId) {
        setOrders(fetchedOrders.filter((o: any) => o.telegram_id === telegramId))
      } else {
        setOrders(fetchedOrders)
      }
      setLoading(false)
    }, (err) => {
      console.error('Firebase orders error:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [telegramId])

  return { orders, loading }
}

export async function createFirebaseOrder(orderData: Partial<Order> & { telegram_id?: number, user_name?: string, user_phone?: string }) {
  // Generate a random ID like #54629707
  const shortId = Math.floor(Math.random() * 90000000) + 10000000
  
  // Fire and forget to prevent UI lag while waiting for Firebase server acknowledgement
  addDoc(collection(db, 'orders'), {
    ...orderData,
    id: shortId,
    created_at: serverTimestamp(),
  }).catch(err => console.error('Firebase order creation error:', err))

  // Simulate a tiny delay for natural feel, but mostly instant
  await new Promise(resolve => setTimeout(resolve, 300))

  return { id: shortId }
}

export async function updateFirebaseOrderStatus(docId: string, status: string, label: string, order?: any, yandexUrl?: string) {
  const ref = doc(db, 'orders', docId)
  try {
    const updateData: any = {
      status,
      status_label: label
    }
    if (yandexUrl) {
      updateData.yandex_tracking_url = yandexUrl
    }
    await updateDoc(ref, updateData)
  } catch (err) {
    console.error("Error updating order status:", err)
    throw err
  }

  // Send telegram notification if order is passed
  try {
    if (order) {
      const telegramId = order.telegram_id || order.user_id || order.customer_id;
      if (telegramId) {
        const BOT_TOKEN = '8957857177:AAFNSzeeQR7NTZHoQ7BbKajJhQyfKrizJSU'
        let message: string
        let parse_mode: string

        if (yandexUrl && yandexUrl.startsWith('http')) {
          message = `🚚 <b>Buyurtma #${order.id} yo'lda!</b>\n\nSizning noningiz yetkazib berishga yuborildi.\n\n<a href="${yandexUrl}">📍 Dostavkani kuzatish</a>\n\nJami: ${order.total_amount?.toLocaleString('ru-RU')} so'm`
          parse_mode = 'HTML'
        } else {
          message = `📦 <b>Buyurtma #${order.id} holati o'zgardi</b>\n\nYangi holat: ${label}\nJami: ${order.total_amount?.toLocaleString('ru-RU')} so'm\n\nTabiiy Non bilan qolganingiz uchun rahmat! 🍞`
          parse_mode = 'HTML'
        }

        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: message,
            parse_mode,
          })
        }).catch(err => console.error("Telegram notification fetch error:", err))
      }
    }
  } catch (err) {
    console.error("Failed to send telegram notification:", err)
  }
}
