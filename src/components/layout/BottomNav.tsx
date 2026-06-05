import { Home, ShoppingCart, ClipboardList, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCartStore, useLangStore } from '@/store'
import { useT } from '@/utils/i18n'
import { useTelegram } from '@/hooks/useTelegram'

const ADMIN_IDS = [1213781907, 5008138452]

const tabs = [
  { path: '/',        icon: Home,          key: 'menu' as const },
  { path: '/cart',    icon: ShoppingCart,  key: 'cart' as const },
  { path: '/orders',  icon: ClipboardList, key: 'orders' as const },
  { path: '/profile', icon: User,          key: 'profile' as const },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { cart } = useCartStore()
  const { language } = useLangStore()
  const t = useT(language)
  const { user } = useTelegram()
  const isAdmin = user?.id ? ADMIN_IDS.includes(user.id) : false

  const cartCount = cart?.items_count ?? 0

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 'var(--nav-height)',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 4,
        paddingRight: 4,
        zIndex: 100,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
    >
      {tabs.map(({ path, icon: Icon, key }) => {
        const active = pathname === path
        const showBadge = key === 'cart' && cartCount > 0
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: active ? '4px 12px' : '8px 4px',
              borderRadius: 'var(--radius-full)',
              background: active ? 'var(--nav-active-bg)' : 'transparent',
              color: active ? 'var(--nav-active-text)' : 'var(--text-3)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              transform: active ? 'scale(0.92)' : 'scale(1)',
              maxWidth: 80,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
              />
              {showBadge && (
                <span style={{
                  position: 'absolute', top: -5, right: -7,
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: '50%',
                  minWidth: 16, height: 16,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,
            }}>
              {t(key)}
            </span>
          </button>
        )
      })}

      {isAdmin && (() => {
        const active = pathname.startsWith('/admin')
        return (
          <button
            onClick={() => navigate('/admin')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: active ? '4px 12px' : '8px 4px',
              borderRadius: 'var(--radius-full)',
              background: active ? 'var(--nav-active-bg)' : 'transparent',
              color: active ? 'var(--nav-active-text)' : 'var(--text-3)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: active ? 'scale(0.92)' : 'scale(1)',
              maxWidth: 80,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>🔧</span>
            <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1 }}>Админ</span>
          </button>
        )
      })()}
    </nav>
  )
}
