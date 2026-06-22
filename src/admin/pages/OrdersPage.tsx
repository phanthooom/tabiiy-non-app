import { useEffect, useState } from 'react'
import { ordersApi } from '../api/index'
import type { Order, OrderStatus } from '../types/index'
import { AddressText } from '@/app/components/ui/AddressText'
import { MapPin, Phone, User, ClipboardList } from 'lucide-react'

const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  accepted:         { label: 'Принят',        bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  packing:          { label: 'Упаковка',       bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  courier_assigned: { label: 'Курьер в пути', bg: '#ede9fe', color: '#7c3aed', dot: '#8b5cf6' },
  ready:            { label: 'Готов',          bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  delivered:        { label: 'Доставлен',      bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  cancelled:        { label: 'Отменён',        bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
}

const DEFAULT_META = { label: 'В обработке', bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' }

const FILTER_TABS = [
  { id: '',                label: 'Все' },
  { id: 'accepted',        label: 'Принят' },
  { id: 'packing',         label: 'Упаковка' },
  { id: 'courier_assigned', label: 'В пути' },
  { id: 'delivered',       label: 'Доставлен' },
  { id: 'cancelled',       label: 'Отменён' },
]

export function OrdersPage() {
  const [orders, setOrders]             = useState<Order[]>([])
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [loading, setLoading]           = useState(false)
  const [selected, setSelected]         = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [yandexUrl, setYandexUrl]       = useState('')
  const [yandexSaving, setYandexSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = ordersApi.subscribe(
      (res) => {
        setOrders(res.items)
        setTotal(res.total)
        setLoading(false)
        setSelected(prev => {
          if (!prev) return null
          const updated = res.items.find(o => o.id === prev.id) || prev
          setYandexUrl((updated as any).yandex_tracking_url || '')
          return updated
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
    } finally {
      setActionLoading(false)
    }
  }

  const saveYandexUrl = async () => {
    if (!selected) return
    setYandexSaving(true)
    try {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../../shared/lib/firebase')
      await updateDoc(doc(db, 'orders', String(selected.id)), { yandex_tracking_url: yandexUrl || null })

      if (yandexUrl && yandexUrl.startsWith('http')) {
        const telegramId = (selected as any).user_id || (selected as any).telegram_id
        const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN
        if (telegramId && BOT_TOKEN) {
          fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramId,
              text: `🚚 Buyurtma #${selected.id} yo'lda!\n\nSizning noningiz yetkazib berishga yuborildi.\n\n[📍 Dostavkani kuzatish](${yandexUrl})\n\n💰 ${(selected.total_amount ?? 0).toLocaleString('ru-RU')} so'm`,
              parse_mode: 'Markdown',
            })
          }).catch(() => {})
        }
      }
    } finally {
      setYandexSaving(false)
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
      {/* Stats card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Всего заказов
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {total}
          </p>
        </div>
        <div style={{
          width: 48, height: 48,
          background: '#fef9ec',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ClipboardList size={22} color="#c8a96e" />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        paddingBottom: 4, marginBottom: 16,
        scrollbarWidth: 'none',
      }}>
        {FILTER_TABS.map(t => {
          const active = filterStatus === t.id
          const isCancelled = t.id === 'cancelled'
          return (
            <button
              key={t.id}
              onClick={() => { setFilterStatus(t.id); setPage(1) }}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: active ? 'none' : isCancelled ? '1px solid #fca5a5' : '1px solid #e5e7eb',
                background: active
                  ? (isCancelled ? '#dc2626' : '#111827')
                  : (isCancelled ? '#fef2f2' : '#ffffff'),
                color: active
                  ? '#ffffff'
                  : (isCancelled ? '#dc2626' : '#6b7280'),
                fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Orders list */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Загрузка...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(o => {
            const meta = STATUS_META[o.status] ?? DEFAULT_META
            return (
              <div
                key={o.id}
                onClick={() => { setSelected(o); setYandexUrl((o as any).yandex_tracking_url || '') }}
                style={{
                  background: o.status === 'cancelled' ? '#fff9f9' : '#ffffff',
                  border: o.status === 'cancelled' ? '1px solid #fecaca' : '1px solid #e5e7eb',
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  opacity: o.status === 'cancelled' ? 0.8 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#c8a96e', fontSize: 14 }}>#{o.id}</span>
                    <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 8 }}>{o.customer_name}</span>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px',
                    borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: meta.bg, color: meta.color,
                    flexShrink: 0, marginLeft: 8,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
                    {meta.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13 }}>
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.address
                      ? <AddressText address={o.address} language="ru" clickable={false} />
                      : 'Самовывоз'
                    }
                  </span>
                  <span style={{ fontWeight: 700, color: '#111827', flexShrink: 0, marginLeft: 8 }}>
                    {o.total_amount.toLocaleString()} сум
                  </span>
                </div>
              </div>
            )
          })}
          {orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 15 }}>Нет заказов</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={pgBtn(page === 1)}
        >
          ←
        </button>
        <span style={{ padding: '8px 14px', color: '#6b7280', fontWeight: 600, fontSize: 14 }}>{page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={orders.length < 20}
          style={pgBtn(orders.length < 20)}
        >
          →
        </button>
      </div>

      {/* Detail bottom sheet */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              width: '100%', maxWidth: 520,
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 20px 24px' }}>
              {/* Sheet header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20, color: '#111827' }}>
                  Заказ <span style={{ color: '#c8a96e' }}>#{selected.id}</span>
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    width: 32, height: 32, background: '#f3f4f6',
                    border: 'none', borderRadius: 8, color: '#6b7280',
                    cursor: 'pointer', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Customer info */}
              <div style={{
                background: '#f9fafb', borderRadius: 14, padding: '14px 16px', marginBottom: 16,
                border: '1px solid #f3f4f6',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <User size={15} color="#9ca3af" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>
                    {(selected as any).user_name || selected.user?.full_name || '—'}
                  </span>
                  {(selected as any).user?.username && (
                    <span style={{ color: '#9ca3af', fontSize: 13 }}>@{selected.user?.username}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <Phone size={15} color="#9ca3af" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#6b7280', fontSize: 14 }}>
                    {(selected as any).user_phone || selected.customer_phone || '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <MapPin size={15} color="#9ca3af" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: '#6b7280', fontSize: 14 }}>
                    {selected.address
                      ? <AddressText address={selected.address} language="ru" clickable={true} />
                      : 'Самовывоз'
                    }
                  </span>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                {selected.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: i < selected.items.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}
                  >
                    <span style={{ color: '#374151', fontSize: 14 }}>{item.product_name} × {item.quantity}</span>
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>
                      {item.subtotal.toLocaleString()} сум
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingTop: 12, marginTop: 4,
                  borderTop: '2px solid #e5e7eb',
                }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Итого</span>
                  <span style={{ fontWeight: 800, fontSize: 17, color: '#c8a96e' }}>
                    {selected.total_amount.toLocaleString()} сум
                  </span>
                </div>
              </div>

              {/* Status buttons */}
              <p style={{
                fontSize: 11, fontWeight: 700, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
              }}>
                Изменить статус
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {(Object.keys(STATUS_META) as OrderStatus[]).map(s => {
                  const meta   = STATUS_META[s] ?? DEFAULT_META
                  const active = selected.status === s
                  return (
                    <button
                      key={s}
                      onClick={() => changeStatus(selected, s)}
                      disabled={actionLoading || active}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: active ? 'none' : '1px solid #e5e7eb',
                        background: active ? '#111827' : '#ffffff',
                        color: active ? '#ffffff' : '#374151',
                        fontSize: 13, fontWeight: 600,
                        cursor: active ? 'default' : 'pointer',
                        fontFamily: 'inherit',
                        opacity: actionLoading && !active ? 0.6 : 1,
                      }}
                    >
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: active ? '#ffffff' : meta.dot,
                      }} />
                      {meta.label}
                    </button>
                  )
                })}
              </div>

              {/* Yandex delivery button */}
              {selected.delivery_type === 'delivery' && !selected.yandex_claim_id && (
                <button
                  onClick={() => callDelivery(selected)}
                  disabled={actionLoading}
                  style={{
                    width: '100%', padding: '12px',
                    background: '#7c3aed', border: 'none', borderRadius: 12,
                    color: '#ffffff', cursor: 'pointer',
                    fontWeight: 700, fontSize: 14, marginBottom: 16,
                    fontFamily: 'inherit',
                  }}
                >
                  Вызвать Яндекс курьера
                </button>
              )}
              {selected.yandex_claim_id && (
                <p style={{ color: '#7c3aed', fontSize: 13, marginBottom: 16 }}>
                  Яндекс claim: {selected.yandex_claim_id}
                </p>
              )}

              {/* Yandex tracking URL */}
              <p style={{
                fontSize: 11, fontWeight: 700, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
              }}>
                Ссылка отслеживания
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={yandexUrl}
                  onChange={e => setYandexUrl(e.target.value)}
                  placeholder="https://go.yandex/route/..."
                  style={{
                    flex: 1, padding: '10px 14px',
                    background: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: 10, color: '#111827', fontSize: 13,
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={saveYandexUrl}
                  disabled={yandexSaving}
                  style={{
                    padding: '10px 16px', background: '#c8a96e',
                    border: 'none', borderRadius: 10,
                    color: '#111827', fontWeight: 700,
                    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                  }}
                >
                  {yandexSaving ? '...' : 'Сохранить'}
                </button>
              </div>
              {yandexUrl && (
                <a
                  href={yandexUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-block', marginTop: 8, color: '#3b82f6', fontSize: 12 }}
                >
                  Открыть ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const pgBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 18px',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  color: disabled ? '#9ca3af' : '#111827',
  fontWeight: 600, fontSize: 14,
  cursor: disabled ? 'default' : 'pointer',
  fontFamily: 'inherit',
})
