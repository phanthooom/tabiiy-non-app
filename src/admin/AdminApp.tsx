import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useAuthStore } from './store/auth'
import { LoginPage } from './pages/LoginPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductsPage } from './pages/ProductsPage'
import { UsersPage } from './pages/UsersPage'
import { SettingsPage } from './pages/SettingsPage'
import { useBackButton } from '../shared/hooks/useTelegram'
import { useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../shared/lib/firebase'
import { ClipboardList, Package, Users, Settings, Wheat } from 'lucide-react'

async function checkTgAdmin(): Promise<boolean> {
  const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
  if (!tgId) return false
  try {
    const snap = await getDoc(doc(db, 'settings', 'main'))
    const ids: number[] = snap.exists() ? (snap.data().admin_telegram_ids ?? []) : []
    return ids.includes(tgId)
  } catch {
    return false
  }
}

type Tab = 'orders' | 'products' | 'users' | 'settings'

function todayDate(): string {
  const d = new Date(Date.now() + 5 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'orders',   label: 'Заказы',    Icon: ClipboardList },
  { key: 'products', label: 'Товары',    Icon: Package },
  { key: 'users',    label: 'Клиенты',   Icon: Users },
  { key: 'settings', label: 'Настройки', Icon: Settings },
]

const TAB_LABELS: Record<Tab, string> = {
  orders:   'Заказы',
  products: 'Товары',
  users:    'Клиенты',
  settings: 'Настройки',
}

export default function AdminApp() {
  const token    = useAuthStore(s => s.token)
  const setToken = useAuthStore(s => s.setToken)
  const logout   = useAuthStore(s => s.logout)
  const [tab, setTab]             = useState<Tab>('orders')
  const [authReady, setAuthReady] = useState(false)
  const [tgAdmin, setTgAdmin]     = useState(false)
  const navigate = useNavigate()

  useBackButton(() => navigate('/'), true)

  // Check Telegram-based admin access (no Google login needed)
  useEffect(() => {
    checkTgAdmin().then(setTgAdmin)
  }, [])

  // Sync Firebase auth state → token (handles refresh + page reload)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        const t = await user.getIdToken()
        setToken(t)
      } else {
        logout()
      }
      setAuthReady(true)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!token) return
    const resetStockIfNeeded = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'main')
        const snap = await getDoc(settingsRef)
        const data = snap.exists() ? snap.data() : {}
        const today = todayDate()
        if (data.last_stock_reset === today) return

        const productsSnap = await getDocs(collection(db, 'products'))
        const updates: Promise<void>[] = []
        productsSnap.forEach(d => {
          const p = d.data()
          if (p.default_quantity != null && p.default_quantity > 0) {
            updates.push(updateDoc(doc(db, 'products', d.id), { quantity: p.default_quantity }))
          }
        })
        await Promise.all(updates)
        await setDoc(settingsRef, { ...data, last_stock_reset: today }, { merge: true })
      } catch (e) {
        console.warn('[Admin] Stock reset failed', e)
      }
    }
    resetStockIfNeeded()
  }, [token])

  if (!authReady) return null
  if (!token && !tgAdmin) return <LoginPage />

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      color: '#111827',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: 'max(env(safe-area-inset-top, 0px), 12px) 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ width: 34, height: 34, background: '#fef9ec', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Wheat size={18} color="#c8a96e" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: '#111827', lineHeight: 1.2 }}>
            Tabiiy Non
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
            {TAB_LABELS[tab]}
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '7px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: 20,
            color: '#6b7280',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Выйти
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '20px 16px 90px',
        maxWidth: 900,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {tab === 'orders'   && <OrdersPage />}
        {tab === 'products' && <ProductsPage />}
        {tab === 'users'    && <UsersPage />}
        {tab === 'settings' && <SettingsPage />}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 50,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '10px 4px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: active ? '#c8a96e' : '#9ca3af',
                transition: 'color 0.15s',
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1 }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
