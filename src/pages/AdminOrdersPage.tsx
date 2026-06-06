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

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return true
    if (activeTab === 'processing') return o.status === 'accepted'
    if (activeTab === 'confirmed') return o.status === 'cooking'
    if (activeTab === 'delivering') return o.status === 'courier'
    if (activeTab === 'delivered') return o.status === 'delivered'
    return true
  })

  const countByStatus = (status: string) => orders.filter(o => o.status === status).length

  return (
    <div style={{ 
      padding: 'calc(var(--tg-safe-area-inset-top, 20px) + 32px) 16px 100px', 
      background: '#f8fafc', 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Buyurtmalar (Admin)</h1>
        <div style={{ 
          background: '#ffffff', 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <Search size={20} color="#64748b" />
        </div>
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
            <AdminOrderCard key={order.id} order={order} />
          ))}
          {filteredOrders.length === 0 && (
            <p style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>Buyurtmalar topilmadi</p>
          )}
        </div>
      )}
    </div>
  )
}

function AdminOrderCard({ order }: { order: any }) {
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
          <p style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>Buyurtma #{order.id}</p>
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
            <p style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>{order.user_name || 'Foydalanuvchi'}</p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>{order.user_phone || '+998 -- --- -- --'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <MapPin size={18} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.4 }}>
            {order.address || 'Manzil kiritilmagan'}
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
