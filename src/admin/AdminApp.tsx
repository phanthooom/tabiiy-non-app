import { useState } from 'react'
import { useAuthStore } from './store/auth'
import { LoginPage } from './pages/LoginPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductsPage } from './pages/ProductsPage'
import { UsersPage } from './pages/UsersPage'

import { useBackButton } from '../shared/hooks/useTelegram'
import { useNavigate } from 'react-router-dom'

type Tab = 'orders' | 'products' | 'users'

export default function AdminApp() {
  const token = useAuthStore(s => s.token)
  const logout = useAuthStore(s => s.logout)
  const [tab, setTab] = useState<Tab>('orders')
  const navigate = useNavigate()

  // Показываем нативную кнопку 'Назад' в Telegram Mini App для возврата в каталог
  useBackButton(() => navigate('/'), true)

  if (!token) return <LoginPage />

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9' }}>
      {/* Header */}
      <div style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '50px 20px 10px', // Увеличенный жесткий отступ для iOS
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <span style={{
          fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginRight: 'auto'
        }}>🍞 Админ панель</span>
        <button onClick={logout} style={{
          padding: '6px 14px', background: '#334155',
          border: 'none', borderRadius: 8, color: '#94a3b8',
          fontSize: 13, cursor: 'pointer',
        }}>Выйти</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '0 20px',
      }}>
        {([
          { key: 'orders', label: '📋 Заказы' },
          { key: 'products', label: '🛍 Товары' },
          { key: 'users', label: '👥 Пользователи' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '14px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: tab === t.key ? '#38bdf8' : '#64748b',
            fontSize: 14,
            fontWeight: tab === t.key ? 700 : 400,
            borderBottom: tab === t.key ? '2px solid #38bdf8' : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'orders' && <OrdersPage />}
        {tab === 'products' && <ProductsPage />}
        {tab === 'users' && <UsersPage />}
      </div>
    </div>
  )
}