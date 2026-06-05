import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Order } from '@/types'

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
  
  await addDoc(collection(db, 'orders'), {
    ...orderData,
    id: shortId,
    created_at: serverTimestamp(),
  })
  return { id: shortId }
}

export async function updateFirebaseOrderStatus(docId: string, status: string, label: string) {
  const ref = doc(db, 'orders', docId)
  await updateDoc(ref, {
    status,
    status_label: label
  })
}
