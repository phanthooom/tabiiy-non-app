import { useEffect, useState } from 'react'
import { ordersApi } from '../api/index'
import type { Order, OrderStatus } from '../types/index'

const STATUS_LABELS: Record<OrderStatus, string> = {
  accepted: '✅ Принят',
  packing: '📦 Упаковывается',
  courier_assigned: '🚗 Курьер в пути',
  delivered: '✅ Доставлен',
  cancelled: '❌ Отменён',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  accepted: '#3b82f6',
  packing: '#f59e0b',
  courier_assigned: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = ordersApi.subscribe(
      (res) => {
        setOrders(res.items)
        setTotal(res.total)
        setLoading(false)
        
        // Обновляем выбранный заказ в модалке, если он изменился
        setSelected(prev => {
          if (!prev) return null
          return res.items.find(o => o.id === prev.id) || prev
        })
      },
      { status: filterStatus || undefined }
    )
    return () => unsubscribe()
  }, [filterStatus])

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setActionLoading(true)
    try {
      await ordersApi.updateStatus(order, status)
      // load() больше не нужен, данные обновятся через onSnapshot
    } finally {
      setActionLoading(false)
    }
  }

  const callDelivery = async (order: Order) => {
    setActionLoading(true)
    try {
      const res = await ordersApi.callDelivery(order.id)
      alert(`Курьер вызван!\nClaim ID: ${res.claim_id}\nЦена: ${res.price}`)
    } catch (e: any) {
      alert('Ошибка: ' + (e.response?.data?.error?.message || e.message))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'accepted', 'packing', 'courier_assigned', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filterStatus === s ? '#c8a96e' : '#2a2a2a',
              color: filterStatus === s ? '#000' : '#aaa', fontSize: 13,
            }}>
            {s ? STATUS_LABELS[s as OrderStatus] : 'Все'}
          </button>
        ))}
      </div>

      <p style={{ color: '#666', marginBottom: 12, fontSize: 14 }}>Всего: {total}</p>

      {loading ? <p style={{ color: '#666' }}>Загрузка...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(o => (
            <div key={o.id} onClick={() => setSelected(o)}
              style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
                padding: '14px 18px', cursor: 'pointer', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8a96e')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#c8a96e', fontWeight: 700 }}>#{o.id}</span>
                  <span style={{ color: '#666', fontSize: 13, marginLeft: 10 }}>
                    {o.customer_name} · {o.customer_phone}
                  </span>
                </div>
                <span style={{
                  background: STATUS_COLORS[o.status] + '22',
                  color: STATUS_COLORS[o.status],
                  padding: '4px 10px', borderRadius: 20, fontSize: 12,
                }}>
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>
                📍 {o.address ? (/^\d+\.\d+,\s*\d+\.\d+$/.test(o.address) ? 'Xaritadan belgilangan manzil' : o.address) : 'Самовывоз'} · {o.items.length} поз. · {o.total_amount.toLocaleString()} сум
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgBtn}>←</button>
        <span style={{ color: '#666', padding: '6px 12px' }}>{page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20} style={pgBtn}>→</button>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#c8a96e', marginBottom: 16 }}>Заказ #{selected.id}</h2>
            <p style={{ color: '#aaa', fontSize: 14 }}>👤 {selected.user.full_name} (@{selected.user.username})</p>
            <p style={{ color: '#aaa', fontSize: 14 }}>📞 {selected.customer_phone}</p>
            <p style={{ color: '#aaa', fontSize: 14 }}>📍 {selected.address ? (/^\d+\.\d+,\s*\d+\.\d+$/.test(selected.address) ? 'Xaritadan belgilangan manzil' : selected.address) : 'Самовывоз'}</p>
            <div style={{ margin: '14px 0', borderTop: '1px solid #2a2a2a', paddingTop: 14 }}>
              {selected.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: 14, marginBottom: 6 }}>
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>{item.subtotal.toLocaleString()} сум</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c8a96e', fontWeight: 700, marginTop: 10 }}>
                <span>Итого</span>
                <span>{selected.total_amount.toLocaleString()} сум</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['accepted', 'packing', 'courier_assigned', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                <button key={s} onClick={() => changeStatus(selected, s)} disabled={actionLoading || selected.status === s}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                    background: selected.status === s ? STATUS_COLORS[s] : '#2a2a2a',
                    color: selected.status === s ? '#fff' : '#aaa',
                  }}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {selected.delivery_type === 'delivery' && !selected.yandex_claim_id && (
              <button onClick={() => callDelivery(selected)} disabled={actionLoading}
                style={{ marginTop: 12, width: '100%', padding: 10, background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                🚗 Вызвать Яндекс курьера
              </button>
            )}
            {selected.yandex_claim_id && (
              <p style={{ color: '#8b5cf6', fontSize: 13, marginTop: 10 }}>
                Яндекс claim: {selected.yandex_claim_id} · {selected.yandex_status}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const pgBtn: React.CSSProperties = {
  padding: '6px 14px', background: '#2a2a2a', border: 'none',
  borderRadius: 8, color: '#aaa', cursor: 'pointer',
}
