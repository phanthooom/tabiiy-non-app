import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, User, MapPin, ChevronDown } from 'lucide-react'
import { useFirebaseOrders, updateFirebaseOrderStatus } from '@/hooks/useFirebaseOrders'

type AdminTab = 'all' | 'processing' | 'confirmed' | 'delivering' | 'delivered'

const STATUSES = [
  { id: 'accepted', label: 'Jarayonda' },
  { id: 'cooking', label: 'Tasdiqlandi' }, // We map cooking to Tasdiqlandi for UX
  { id: 'courier', label: "Yo'lda" },
  { id: 'delivered', label: 'Yetkazildi' }
]

export function AdminOrdersPage() {
  const { orders, loading } = useFirebaseOrders(null) // null = all orders
  const [activeTab, setActiveTab] = useState<AdminTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = orders.filter(o => {
    // 1. Filter by Tab
    let tabMatch = true
    if (activeTab === 'processing') tabMatch = o.status === 'accepted'
    if (activeTab === 'confirmed') tabMatch = o.status === 'cooking'
    if (activeTab === 'delivering') tabMatch = o.status === 'courier'
    if (activeTab === 'delivered') tabMatch = o.status === 'delivered'
    
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
      padding: 'calc(var(--tg-safe-area-inset-top, 20px) + 32px) 16px 100px', 
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
          { id: 'all', label: `Barchasi (${orders.length})` },
          { id: 'processing', label: `Jarayonda (${countByStatus('accepted')})` },
          { id: 'confirmed', label: `Tasdiqlandi (${countByStatus('cooking')})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as AdminTab)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: activeTab === t.id ? 'none' : '1px solid #cbd5e1',
              background: activeTab === t.id ? '#0f172a' : '#ffffff',
              color: activeTab === t.id ? '#ffffff' : '#475569',
              fontWeight: 600, fontSize: 14,
              whiteSpace: 'nowrap', flexShrink: 0,
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
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
    if (order._docId) {
      await updateFirebaseOrderStatus(order._docId, statusId, label)
    }
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
        background: '#ffffff',
        borderRadius: 16,
        padding: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
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
          background: order.status === 'accepted' ? '#e0f2fe' : '#ffedd5',
          color: order.status === 'accepted' ? '#0369a1' : '#c2410c',
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
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
          <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.4 }}>
            <Highlight text={order.address || 'Manzil kiritilmagan'} query={searchQuery} />
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Holatni o'zgartirish:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUSES.map(st => (
            <button
              key={st.id}
              onClick={() => handleStatusChange(st.id, st.label)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: order.status === st.id ? 'none' : '1px solid #cbd5e1',
                background: order.status === st.id ? '#0f172a' : '#ffffff',
                color: order.status === st.id ? '#ffffff' : '#475569',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
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
