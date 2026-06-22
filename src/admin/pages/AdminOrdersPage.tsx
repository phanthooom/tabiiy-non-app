import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, User, MapPin, ChevronDown, Truck, Store } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import { useFirebaseOrders, updateFirebaseOrderStatus } from '@/shared/hooks/useFirebaseOrders'
import { useBackButton } from '@/shared/hooks/useTelegram'
import { AddressText } from '@/app/components/ui/AddressText'

type AdminSection = 'delivery' | 'pickup'
type AdminTab = 'all' | 'processing' | 'confirmed' | 'delivering' | 'ready' | 'delivered' | 'cancelled'

const DELIVERY_STATUSES = [
  { id: 'accepted',         label: 'Jarayonda' },
  { id: 'packing',          label: 'Tasdiqlandi' },
  { id: 'courier_assigned', label: "Yo'lda" },
  { id: 'delivered',        label: 'Yetkazildi' },
]

const PICKUP_STATUSES = [
  { id: 'accepted', label: 'Jarayonda' },
  { id: 'packing',  label: 'Tasdiqlandi' },
  { id: 'ready',    label: 'Tayyor' },
  { id: 'delivered', label: 'Olindi' },
]

const STATUS_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  accepted:         { bg: '#e0f2fe', color: '#0369a1' },
  packing:          { bg: '#fff7ed', color: '#c2410c' },
  courier_assigned: { bg: '#ede9fe', color: '#6d28d9' },
  ready:            { bg: '#f0fdf4', color: '#166534' },
  delivered:        { bg: '#dcfce7', color: '#166534' },
  cancelled:        { bg: '#fef2f2', color: '#dc2626' },
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  useBackButton(() => navigate('/'))

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    if (tgId) {
      getDoc(doc(db, 'settings', 'main')).then(snap => {
        const ids: number[] = snap.exists() ? (snap.data().admin_telegram_ids ?? []) : []
        if (ids.includes(tgId)) {
          setIsAuthenticated(true)
        }
      }).catch(() => {})
    } else {
      const saved = localStorage.getItem('admin_auth')
      if (saved === 'true') setIsAuthenticated(true)
    }
  }, [])

  const { orders, loading } = useFirebaseOrders(null)
  const [section, setSection] = useState<AdminSection>('delivery')
  const [activeTab, setActiveTab] = useState<AdminTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const sectionOrders = orders.filter(o => {
    const dt = (o as any).delivery_type
    return section === 'pickup' ? dt === 'pickup' : dt !== 'pickup'
  })

  const filteredOrders = sectionOrders.filter(o => {
    let tabMatch = true
    if (activeTab === 'processing') tabMatch = o.status === 'accepted'
    if (activeTab === 'confirmed')  tabMatch = o.status === 'packing'
    if (activeTab === 'delivering') tabMatch = o.status === 'courier_assigned'
    if (activeTab === 'ready')      tabMatch = o.status === 'ready'
    if (activeTab === 'delivered')  tabMatch = o.status === 'delivered'
    if (activeTab === 'cancelled')  tabMatch = o.status === 'cancelled'

    let searchMatch = true
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const oAny = o as any
      const searchString = `${o.id || ''} ${oAny.user_name || ''} ${oAny.user_phone || ''} ${o.address || ''}`.toLowerCase()
      searchMatch = searchString.includes(q)
    }

    return tabMatch && searchMatch
  })

  const countIn = (status: string) => sectionOrders.filter(o => o.status === status).length

  const deliveryTabs = [
    { id: 'all',        label: `Barchasi (${sectionOrders.length})`,            red: false },
    { id: 'processing', label: `Jarayonda (${countIn('accepted')})`,             red: false },
    { id: 'confirmed',  label: `Tasdiqlandi (${countIn('packing')})`,            red: false },
    { id: 'delivering', label: `Yo'lda (${countIn('courier_assigned')})`,        red: false },
    { id: 'delivered',  label: `Yetkazildi (${countIn('delivered')})`,           red: false },
    { id: 'cancelled',  label: `Bekor (${countIn('cancelled')})`,                red: true  },
  ]

  const pickupTabs = [
    { id: 'all',       label: `Barchasi (${sectionOrders.length})`,              red: false },
    { id: 'processing', label: `Jarayonda (${countIn('accepted')})`,             red: false },
    { id: 'confirmed',  label: `Tasdiqlandi (${countIn('packing')})`,            red: false },
    { id: 'ready',      label: `Tayyor (${countIn('ready')})`,                   red: false },
    { id: 'delivered',  label: `Olindi (${countIn('delivered')})`,               red: false },
    { id: 'cancelled',  label: `Bekor (${countIn('cancelled')})`,                red: true  },
  ]

  const tabs = section === 'pickup' ? pickupTabs : deliveryTabs

  const handleSectionChange = (s: AdminSection) => {
    setSection(s)
    setActiveTab('all')
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', padding: 20 }}>
        <Store size={48} color="#e8751a" style={{ marginBottom: 20 }} />
        <h2 style={{ marginBottom: 20, color: '#0f172a', fontWeight: 800 }}>Admin Panel</h2>
        <input 
          type="password" 
          placeholder="Parolni kiriting..." 
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: 16, width: '100%', maxWidth: 300, fontSize: 16, outline: 'none' }}
        />
        <button 
          onClick={() => {
            if (password === 'tabiiynon2026') {
              localStorage.setItem('admin_auth', 'true')
              setIsAuthenticated(true)
            } else {
              alert('Parol xato!')
            }
          }}
          style={{ padding: '14px 16px', borderRadius: 12, background: '#0f172a', color: '#fff', border: 'none', width: '100%', maxWidth: 300, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
        >
          Kirish
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
    }}>
      {/* ── Fixed top sections ── */}
      <div style={{
        flexShrink: 0,
        padding: 'calc(var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, 44px)) + 12px) 16px 0',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {/* Header — centered title */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <h1 style={{
            fontSize: 20, fontWeight: 800, color: '#0f172a',
            letterSpacing: '-0.02em', margin: 0,
          }}>
            Buyurtmalar
          </h1>
        </div>

        {/* Section toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: '#e2e8f0', borderRadius: 12, padding: 4 }}>
          {([
            { id: 'delivery', label: "Yetkazib berish", icon: <Truck size={14} />, count: orders.filter(o => (o as any).delivery_type !== 'pickup').length },
            { id: 'pickup',   label: "O'z olish",       icon: <Store size={14} />, count: orders.filter(o => (o as any).delivery_type === 'pickup').length },
          ] as const).map(s => {
            const isActive = section === s.id
            return (
              <button
                key={s.id}
                onClick={() => handleSectionChange(s.id)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: 'none',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  fontWeight: 700, fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.18s',
                  fontFamily: 'inherit',
                }}
              >
                {s.icon}
                {s.label}
                <span style={{
                  background: isActive ? '#e8751a' : '#94a3b8',
                  color: '#fff',
                  borderRadius: 99,
                  padding: '1px 7px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {s.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{ position: 'absolute', top: 0, left: 14, height: '100%', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <Search size={17} color="#94a3b8" />
          </div>
          <input
            type="text"
            placeholder="ID, ism, raqam yoki manzil..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 16px 10px 38px',
              fontSize: 14, color: '#0f172a',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Status tabs */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          paddingBottom: 12,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {tabs.map(t => {
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as AdminTab)}
                style={{
                  padding: '7px 13px',
                  borderRadius: 20,
                  border: isActive ? 'none' : t.red ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                  background: isActive ? (t.red ? '#dc2626' : '#0f172a') : (t.red ? '#fef2f2' : '#ffffff'),
                  color: isActive ? '#ffffff' : (t.red ? '#dc2626' : '#475569'),
                  fontWeight: 600, fontSize: 12,
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
      </div>

      {/* ── Scrollable orders list ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px calc(env(safe-area-inset-bottom, 16px) + 16px)',
        WebkitOverflowScrolling: 'touch',
      } as React.CSSProperties}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>Yuklanmoqda...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredOrders.map(order => (
              <AdminOrderCard
                key={order.id}
                order={order}
                searchQuery={searchQuery}
                isPickup={section === 'pickup'}
              />
            ))}
            {filteredOrders.length === 0 && (
              <p style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>Buyurtmalar topilmadi</p>
            )}
          </div>
        )}
      </div>
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

function AdminOrderCard({ order, searchQuery, isPickup }: { order: any; searchQuery: string; isPickup: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const statuses = isPickup ? PICKUP_STATUSES : DELIVERY_STATUSES

  const handleStatusChange = async (statusId: string, label: string) => {
    if (!order._docId) {
      alert("Xatolik: Buyurtma ID topilmadi")
      return
    }
    if (statusId === 'cancelled') {
      const confirmed = window.confirm(
        `Buyurtma #${order.id} ni bekor qilishni tasdiqlaysizmi?\n(bu amalni qaytarib bo'lmaydi)`
      )
      if (!confirmed) return
    }
    
    let yandexUrl = ''
    if (statusId === 'courier_assigned') {
      const url = window.prompt("Yandex Dostavka linkini kiriting (Mijoz kuzatishi uchun):\nBo'sh qoldirishingiz ham mumkin.")
      if (url === null) return // User clicked cancel
      yandexUrl = url.trim()
    }
    
    try {
      await updateFirebaseOrderStatus(order._docId, statusId, label, order, yandexUrl)
    } catch (err: any) {
      alert("Xatolik yuz berdi: " + (err.message || "Noma'lum xato"))
    }
  }

  const dateObj = new Date(order.created_at)
  const formattedDate =
    dateObj.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) +
    ', ' +
    dateObj.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

  const badgeColors = STATUS_BADGE_COLORS[order.status] ?? STATUS_BADGE_COLORS.accepted

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>
            Buyurtma #<Highlight text={order.id} query={searchQuery} />
          </p>
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{formattedDate}</p>
        </div>
        <span style={{
          background: badgeColors.bg,
          color: badgeColors.color,
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
        }}>
          {order.status_label || 'Jarayonda'}
        </span>
      </div>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: '#64748b', fontSize: 14 }}>Jami summa:</p>
        <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
          {order.total_amount.toLocaleString('ru-RU')} so'm
        </p>
      </div>

      {/* User + address */}
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
          {isPickup
            ? <Store size={18} color="#e8751a" style={{ marginTop: 2, flexShrink: 0 }} />
            : <MapPin size={18} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />}
          <div style={{ color: '#334155', fontSize: 14, lineHeight: 1.4 }}>
            {isPickup ? (
              <span style={{ color: '#e8751a', fontWeight: 600 }}>
                Tabiiy Non — ул. Самарканд Дарвоза, 2/1
              </span>
            ) : order.address ? (
              <AddressText address={order.address} language="uz" clickable={true} />
            ) : (
              'Manzil kiritilmagan'
            )}
          </div>
        </div>
      </div>

      {/* Status buttons */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Holatni o'zgartirish:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {statuses.map(st => {
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
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {st.label}
              </button>
            )
          })}
        </div>

        {order.status !== 'cancelled' ? (
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
                fontFamily: 'inherit',
              }}
            >
              ✕ Buyurtmani bekor qilish
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>✕ Buyurtma bekor qilingan</span>
          </div>
        )}
      </div>

      {/* Expand items */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'none', border: 'none',
          color: '#0f172a', fontWeight: 600, fontSize: 14,
          cursor: 'pointer', padding: '8px 0',
          borderTop: '1px solid #f1f5f9', marginTop: 8, paddingTop: 16,
          fontFamily: 'inherit',
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
