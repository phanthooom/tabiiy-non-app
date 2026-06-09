import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, User, MapPin, ChevronDown } from 'lucide-react'
import { useFirebaseOrders, updateFirebaseOrderStatus } from '@/hooks/useFirebaseOrders'
import { useBackButton } from '@/hooks/useTelegram'
import { AddressText } from '@/components/ui/AddressText'

type AdminTab = 'all' | 'processing' | 'confirmed' | 'delivering' | 'delivered' | 'cancelled'

const STATUSES = [
  { id: 'accepted', label: 'Jarayonda', cancel: false },
  { id: 'packing', label: 'Tasdiqlandi', cancel: false },
  { id: 'courier_assigned', label: "Yo'lda", cancel: false },
  { id: 'delivered', label: 'Yetkazildi', cancel: false },
  { id: 'cancelled', label: '✕ Bekor qilindi', cancel: true },
]

const STATUS_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  accepted:         { bg: '#e0f2fe', color: '#0369a1' },
  packing:          { bg: '#fff7ed', color: '#c2410c' },
  courier_assigned: { bg: '#f0fdf4', color: '#166534' },
  ready:            { bg: '#f0fdf4', color: '#166534' },
  delivered:        { bg: '#dcfce7', color: '#166534' },
  cancelled:        { bg: '#fef2f2', color: '#dc2626' },
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  useBackButton(() => navigate('/'))

  const { orders, loading } = useFirebaseOrders(null) // null = all orders
  const [activeTab, setActiveTab] = useState<AdminTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = orders.filter(o => {
    // 1. Filter by Tab
    let tabMatch = true
    if (activeTab === 'processing') tabMatch = o.status === 'accepted'
    if (activeTab === 'confirmed') tabMatch = o.status === 'packing'
    if (activeTab === 'delivering') tabMatch = o.status === 'courier_assigned'
    if (activeTab === 'delivered') tabMatch = o.status === 'delivered'
    if (activeTab === 'cancelled') tabMatch = o.status === 'cancelled'
    
    // 2. Filter by Search Query
    let searchMatch = true
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const oAny = o as any
      const searchString = `
        ${o.id || ''} 
        ${oAny.user_name || ''} 
        ${oAny.user_phone || ''} 
        ${o.address || ''}
      `.toLowerCase()
      searchMatch = searchString.includes(q)
    }

    return tabMatch && searchMatch
  })

  const countByStatus = (status: string) => orders.filter(o => o.status === status).length

  return (
    <div style={{ 
      padding: 'calc(var(--tg-safe-area-inset-top, 20px) + 12px) 16px 100px', 
      background: '#f8fafc', 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Buyurtmalar (Admin)</h1>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{
          position: 'absolute', top: 0, left: 14, height: '100%',
          display: 'flex', alignItems: 'center', pointerEvents: 'none'
        }}>
          <Search size={18} color="#94a3b8" />
        </div>
        <input 
          type="text" 
          placeholder="ID, ism, raqam yoki manzil bo'yicha qidiruv..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '12px 16px 12px 40px',
            fontSize: 15,
            color: '#0f172a',
            outline: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12,
        scrollbarWidth: 'none', msOverflowStyle: 'none'
      }}>
        {[
          { id: 'all',        label: `Barchasi (${orders.length})`,                   red: false },
          { id: 'processing', label: `Jarayonda (${countByStatus('accepted')})`,       red: false },
          { id: 'confirmed',  label: `Tasdiqlandi (${countByStatus('packing')})`,      red: false },
          { id: 'delivering', label: `Yo'lda (${countByStatus('courier_assigned')})`,  red: false },
          { id: 'delivered',  label: `Yetkazildi (${countByStatus('delivered')})`,     red: false },
          { id: 'cancelled',  label: `Bekor (${countByStatus('cancelled')})`,          red: true  },
        ].map(t => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as AdminTab)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: isActive ? 'none' : t.red ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                background: isActive ? (t.red ? '#dc2626' : '#0f172a') : (t.red ? '#fef2f2' : '#ffffff'),
                color: isActive ? '#ffffff' : (t.red ? '#dc2626' : '#475569'),
                fontWeight: 600, fontSize: 14,
                whiteSpace: 'nowrap', flexShrink: 0,
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>Yuklanmoqda...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredOrders.map(order => (
            <AdminOrderCard key={order.id} order={order} searchQuery={searchQuery} />
          ))}
          {filteredOrders.length === 0 && (
            <p style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>Buyurtmalar topilmadi</p>
          )}
        </div>
      )}
    </div>
  )
}

function Highlight({ text, query }: { text: string | number; query: string }) {
  if (!query || !text) return <>{text}</>
  const str = String(text)
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = str.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: '#fef08a', color: '#854d0e', borderRadius: 3, padding: '0 2px' }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function AdminOrderCard({ order, searchQuery }: { order: any; searchQuery: string }) {
  const [expanded, setExpanded] = useState(false)

  const handleStatusChange = async (statusId: string, label: string) => {
    if (!order._docId) return
    if (statusId === 'cancelled') {
      const confirmed = window.confirm(
        `Buyurtma #${order.id} ni bekor qilishni tasdiqlaysizmi?\n(bu amalni qaytarib bo'lmaydi)`
      )
      if (!confirmed) return
    }
    await updateFirebaseOrderStatus(order._docId, statusId, label, order)
  }

  // Format date
  const dateObj = new Date(order.created_at)
  const formattedDate = dateObj.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) + ', ' + 
                        dateObj.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: order.status === 'cancelled' ? '#fff9f9' : '#ffffff',
        borderRadius: 16,
        padding: '16px',
        border: order.status === 'cancelled' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        opacity: order.status === 'cancelled' ? 0.85 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>
            Buyurtma #<Highlight text={order.id} query={searchQuery} />
          </p>
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{formattedDate}</p>
        </div>
        <span style={{
          background: (STATUS_BADGE_COLORS[order.status] ?? STATUS_BADGE_COLORS.accepted).bg,
          color: (STATUS_BADGE_COLORS[order.status] ?? STATUS_BADGE_COLORS.accepted).color,
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
        }}>
          {order.status_label || 'Jarayonda'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: '#64748b', fontSize: 14 }}>Jami summa:</p>
        <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
          {order.total_amount.toLocaleString('ru-RU')} so'm
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <User size={18} color="#64748b" style={{ marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>
              <Highlight text={order.user_name || 'Foydalanuvchi'} query={searchQuery} />
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>
              <Highlight text={order.user_phone || '+998 -- --- -- --'} query={searchQuery} />
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <MapPin size={18} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ color: '#334155', fontSize: 14, lineHeight: 1.4 }}>
            {order.address ? (
              <AddressText address={order.address} language="uz" clickable={true} />
            ) : (
              'Manzil kiritilmagan'
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Holatni o'zgartirish:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUSES.filter(st => !st.cancel).map(st => {
            const isActive = order.status === st.id
            return (
              <button
                key={st.id}
                onClick={() => handleStatusChange(st.id, st.label)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: isActive ? 'none' : '1px solid #cbd5e1',
                  background: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {st.label}
              </button>
            )
          })}
        </div>
        {/* Cancel button — separated, destructive */}
        {order.status !== 'cancelled' && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => handleStatusChange('cancelled', 'Bekor qilindi')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid #fca5a5',
                background: '#fef2f2',
                color: '#dc2626',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Buyurtmani bekor qilish
            </button>
          </div>
        )}
        {order.status === 'cancelled' && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
              ✕ Buyurtma bekor qilingan
            </span>
          </div>
        )}
      </div>

      <button 
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'none', border: 'none',
          color: '#0f172a', fontWeight: 600, fontSize: 14,
          cursor: 'pointer', padding: '8px 0',
          borderTop: '1px solid #f1f5f9', marginTop: 8, paddingTop: 16
        }}
      >
        Tovarlarni ko'rsatish
        <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {expanded && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#334155' }}>{item.product_name} x{item.quantity}</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.subtotal.toLocaleString('ru-RU')} so'm</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
