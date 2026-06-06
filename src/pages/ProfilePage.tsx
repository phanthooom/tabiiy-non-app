import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, MapPin, CreditCard, Bell, Globe, LogOut, ChevronRight, Shield
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useLangStore, useDeliveryStore, useCartStore } from '@/store'
import { BYPASS_MODE, mockUser } from '@/lib/mock-data'
import type { Language } from '@/types'

export function ProfilePage() {
  const navigate = useNavigate()
  const { language, setLanguage } = useLangStore()
  const { user, clear: clearAuth } = useAuthStore()
  const { clearCart } = useCartStore()
  const { setDeliveryType } = useDeliveryStore()
  const displayUser = BYPASS_MODE ? mockUser : user
  
  const isAdmin = window.Telegram?.WebApp?.initDataUnsafe?.user?.id === 638384527 || import.meta.env.VITE_BYPASS_AUTH === 'true'

  const [showLangPicker, setShowLangPicker] = useState(false)

  const handleLogout = () => {
    clearAuth()
    clearCart()
    setDeliveryType(null)
    navigate('/welcome', { replace: true })
  }

  const menuItems = [
    { icon: <User size={20} strokeWidth={1.8} />, label: language === 'uz' ? "Mening ma'lumotlarim" : 'Мои данные', action: () => {} },
    { icon: <MapPin size={20} strokeWidth={1.8} />, label: language === 'uz' ? 'Manzillarim' : 'Мои адреса', action: () => {} },
    { icon: <CreditCard size={20} strokeWidth={1.8} />, label: language === 'uz' ? "To'lov usullari" : 'Способы оплаты', action: () => {} },
    { icon: <Bell size={20} strokeWidth={1.8} />, label: language === 'uz' ? 'Xabarnomalar' : 'Уведомления', action: () => {} },
    ...(isAdmin ? [{ 
      icon: <Shield size={20} strokeWidth={1.8} />, 
      label: 'Admin paneli', 
      action: () => navigate('/admin-orders') 
    }] : []),
    {
      icon: <Globe size={20} strokeWidth={1.8} />,
      label: language === 'uz' ? 'Til' : 'Язык',
      sub: language === 'uz' ? "O'zbekcha" : 'Русский',
      action: () => setShowLangPicker(v => !v),
      expanded: showLangPicker,
    },
  ]

  return (
    <div style={{ padding: '20px 16px 100px' }}>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 60, height: 60,
          borderRadius: 14,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, flexShrink: 0,
          overflow: 'hidden',
        }}>
          {window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url ? (
            <img 
              src={window.Telegram.WebApp.initDataUnsafe.user.photo_url} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : '🧑'}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)', lineHeight: 1.25 }}>
            {displayUser?.full_name ?? '—'}
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 2 }}>
            {displayUser?.phone || (language === 'uz' ? 'Raqam kiritilmagan' : 'Номер не указан')}
          </p>
        </div>
      </motion.div>

      {/* Settings list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {menuItems.map((item, i) => (
          <div key={i}>
            <button
              onClick={item.action}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center',
                gap: 14,
                padding: '15px 16px',
                background: 'none', border: 'none',
                borderBottom: i < menuItems.length - 1 && !item.expanded ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
              }}
            >
              <span style={{ color: 'var(--primary)', flexShrink: 0, display: 'flex' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, fontSize: 15, color: 'var(--text)', fontWeight: 500 }}>
                {item.label}
              </span>
              {item.sub && (
                <span style={{ fontSize: 13, color: 'var(--text-3)', marginRight: 4 }}>
                  {item.sub}
                </span>
              )}
              <ChevronRight size={18} color="var(--text-3)" strokeWidth={2} />
            </button>

            {/* Language picker dropdown */}
            <AnimatePresence>
              {item.expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  {(['ru', 'uz'] as Language[]).map((lang, li, arr) => (
                    <button
                      key={lang}
                      onClick={() => { setLanguage(lang); setShowLangPicker(false) }}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '13px 16px 13px 50px',
                        background: language === lang ? 'var(--surface-3)' : 'none',
                        border: 'none',
                        borderBottom: li < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        fontSize: 15,
                        color: language === lang ? 'var(--accent)' : 'var(--text)',
                        fontWeight: language === lang ? 600 : 400,
                        fontFamily: 'var(--font-body)',
                        textAlign: 'left',
                      }}
                    >
                      {lang === 'ru' ? '🇷🇺 Русский' : "🇺🇿 O'zbekcha"}
                      {language === lang && <span style={{ fontSize: 16, color: 'var(--accent)' }}>✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      {/* Logout button */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10,
          padding: '16px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        <LogOut size={18} color="var(--text-2)" strokeWidth={2} />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.05em' }}>
          CHIQISH
        </span>
      </motion.button>
    </div>
  )
}
