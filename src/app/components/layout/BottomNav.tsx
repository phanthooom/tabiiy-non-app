import { Home, ShoppingCart, ClipboardList, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCartStore, useLangStore } from '@/app/store'
import { useT } from '@/shared/utils/i18n'

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

  const cartCount = cart?.items_count ?? 0

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 'var(--nav-height)',
        background: '#f1f8f8',
        borderTop: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 4,
        paddingRight: 4,
        zIndex: 100,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.03)',
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
              gap: 4,
              padding: active ? '8px 16px' : '10px 4px',
              borderRadius: 14,
              background: active ? '#faebd7' : 'transparent',
              color: active ? '#9a3412' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              transform: active ? 'scale(0.96)' : 'scale(1)',
              maxWidth: 80,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
              />
              {showBadge && (
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  background: '#e8751a',
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
              fontWeight: 700,
              lineHeight: 1,
              textTransform: 'capitalize',
            }}>
              {t(key)}
            </span>
          </button>
        )
      })}

    </nav>
  )
}
