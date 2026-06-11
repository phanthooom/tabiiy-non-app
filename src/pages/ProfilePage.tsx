import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, MapPin, CreditCard, Bell, Globe, LogOut, ChevronRight, Shield, ArrowLeft, Trash2,
  Phone, Mail, Save, Pencil, Home, Briefcase, Plus
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useLangStore, useDeliveryStore, useCartStore } from '@/store'
import { BYPASS_MODE, mockUser } from '@/lib/mock-data'
import type { Language } from '@/types'

interface ProfilePageProps {
  sub?: 'personal-info' | 'addresses' | 'payments' | 'notifications'
}

function SubPageShell({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'calc(var(--tg-content-safe-area-inset-top, 0px) + 16px) 16px 20px',
        background: 'linear-gradient(180deg, var(--surface) 0%, transparent 100%)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            position: 'absolute', left: 20,
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}
        >
          <ArrowLeft size={24} color="var(--text)" strokeWidth={2} />
        </button>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
          {title.length > 20 ? title.slice(0, 20) + '...' : title}
        </span>
      </div>
      {children}
    </div>
  )
}

function PersonalInfoPage({ lang }: { lang: Language }) {
  const { user } = useAuthStore()
  const displayUser = BYPASS_MODE ? mockUser : user
  const title = lang === 'uz' ? "Mening ma'lumotlarim" : 'Мои данные'
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(
    window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url ?? null
  )

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarSrc(url)
  }

  return (
    <SubPageShell title={title}>
      <div style={{ padding: '28px 16px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              width: 104, height: 104, borderRadius: 20,
              overflow: 'hidden', background: '#fff',
              border: '3px solid #fff',
              boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, background: 'var(--surface-2)' }}>🧑</div>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: -6, right: -6,
                width: 34, height: 34, borderRadius: 10,
                background: '#0f172a', border: '3px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Pencil size={15} color="#fff" strokeWidth={2.5} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 4 }}
          >
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
              {lang === 'uz' ? "Rasmni o'zgartirish" : 'Изменить фото'}
            </span>
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8, marginBottom: 8 }}>
          <FormField
            label={lang === 'uz' ? 'Ism' : 'Имя'}
            icon={<User size={18} color="#475569" strokeWidth={2} />}
            value={displayUser?.full_name ?? ''}
            readOnly
          />
          <FormField
            label={lang === 'uz' ? 'Telefon raqam' : 'Телефон'}
            icon={<Phone size={18} color="#475569" strokeWidth={2} />}
            value={displayUser?.phone ?? ''}
            readOnly
          />
          <FormField
            label={lang === 'uz' ? 'Elektron pochta' : 'Эл. почта'}
            icon={<Mail size={18} color="#475569" strokeWidth={2} />}
            value={email}
            placeholder={lang === 'uz' ? 'Emailingizni kiriting' : 'Введите email'}
            onChange={setEmail}
          />
        </div>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          style={{
            width: '100%', padding: '16px',
            background: saved ? '#22c55e' : '#e8751a',
            border: 'none', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'background 0.25s',
          }}
        >
          <Save size={18} color="#fff" strokeWidth={2.5} />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>
            {saved ? (lang === 'uz' ? 'SAQLANDI ✓' : 'СОХРАНЕНО ✓') : (lang === 'uz' ? 'SAQLASH' : 'СОХРАНИТЬ')}
          </span>
        </motion.button>
      </div>
    </SubPageShell>
  )
}

function FormField({ label, icon, value, readOnly, placeholder, onChange }: {
  label: string
  icon: React.ReactNode
  value: string
  readOnly?: boolean
  placeholder?: string
  onChange?: (v: string) => void
}) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{label}</p>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff', border: '1px solid #cbd5e1',
        borderRadius: 12, padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
        <input
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 15, fontWeight: 400,
            color: 'var(--text)',
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>
    </div>
  )
}

function AddressesPage({ lang }: { lang: Language }) {
  const title = lang === 'uz' ? 'Manzillarim' : 'Мои адреса'
  const { savedAddresses, removeAddress, setAddress } = useDeliveryStore()
  const navigate = useNavigate()

  const getIcon = (type: string) => {
    if (type === 'home') return <Home size={22} color="#0f172a" />
    if (type === 'work') return <Briefcase size={22} color="#0f172a" />
    return <MapPin size={22} color="#0f172a" />
  }

  return (
    <SubPageShell title={title}>
      <div style={{ padding: '16px' }}>
        
        {/* Add new address button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            navigate('/delivery-location', { state: { returnToProfile: true } })
          }}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px',
            background: '#e8751a',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            marginBottom: 20,
            boxShadow: '0 4px 12px rgba(232, 117, 26, 0.2)'
          }}
        >
          <span style={{ fontSize: 18, color: '#fff', fontWeight: 600, display: 'flex' }}><Plus size={20} strokeWidth={2.5}/></span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
            {lang === 'uz' ? '+ YANGI MANZIL QO\'SHISH' : '+ ДОБАВИТЬ НОВЫЙ АДРЕС'}
          </span>
        </motion.button>

        {/* Address List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {savedAddresses.map(addr => (
            <motion.div
              key={addr.id}
              onClick={() => {
                setAddress(addr.address)
                navigate(-1) // go back with selected address
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', gap: 16,
                padding: '16px',
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {getIcon(addr.type)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, paddingRight: 56 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  {addr.title}
                </p>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.4, marginBottom: 8 }}>
                  {addr.address}
                </p>
                {addr.details && (
                  <p style={{ fontSize: 12, color: '#64748b' }}>
                    <span style={{ opacity: 0.8 }}>{lang === 'uz' ? 'Mo\'ljal: ' : 'Ориентир: '}</span>{addr.details.replace('Mo\'ljal: ', '')}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{
                position: 'absolute', top: 18, right: 16,
                display: 'flex', gap: 12
              }}>
                <button
                  onClick={(e) => { e.stopPropagation(); /* edit logic */ }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#64748b' }}
                >
                  <Pencil size={20} strokeWidth={2} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeAddress(addr.id) }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#64748b' }}
                >
                  <Trash2 size={20} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </SubPageShell>
  )
}

const SAVED_METHODS = [
  { id: 'uzcard', type: 'card', label: 'Uzcard', last4: '4567', logo: 'UZCARD' },
  { id: 'humo', type: 'card', label: 'Humo', last4: '8901', logo: 'HUMO' },
  { id: 'cash', type: 'cash', label: 'Naqd pul', last4: null, logo: null },
]

function CardLogo({ logo }: { logo: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    UZCARD: { bg: '#e8f0fe', color: '#1a56db' },
    HUMO: { bg: '#fce7f3', color: '#9d174d' },
  }
  const c = colors[logo] ?? { bg: '#f1f5f9', color: '#475569' }
  return (
    <div style={{
      width: 52, height: 34, borderRadius: 6,
      background: c.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: c.color, letterSpacing: '0.02em' }}>{logo}</span>
    </div>
  )
}

function CashLogo() {
  return (
    <div style={{
      width: 52, height: 34, borderRadius: 6,
      background: '#ecfdf5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 18 }}>💵</span>
    </div>
  )
}

function PaymentsPage({ lang }: { lang: Language }) {
  const title = lang === 'uz' ? "To'lov usullari" : 'Способы оплаты'
  const [selected, setSelected] = useState('uzcard')
  const [methods, setMethods] = useState(SAVED_METHODS)

  const removeMethod = (id: string) => {
    const next = methods.filter(m => m.id !== id)
    setMethods(next)
    if (selected === id && next.length > 0) setSelected(next[0].id)
  }

  return (
    <SubPageShell title={title}>
      <div style={{ padding: '16px' }}>
        {/* Add new card button */}
        <button
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px',
            background: 'var(--surface)',
            border: '1.5px dashed #e8751a',
            borderRadius: 14,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            marginBottom: 24,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#fff4ec',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1, color: '#e8751a' }}>+</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#e8751a' }}>
            {lang === 'uz' ? 'Yangi karta qo\'shish' : 'Добавить карту'}
          </span>
        </button>

        {/* Saved methods section */}
        {methods.length > 0 && (
          <>
            <p style={{
              fontSize: 12, fontWeight: 700, color: 'var(--text-3)',
              letterSpacing: '0.08em', marginBottom: 10,
            }}>
              {lang === 'uz' ? 'SAQLANGAN USULLAR' : 'СОХРАНЁННЫЕ'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {methods.map(m => {
                const isSelected = selected === m.id
                return (
                  <motion.div
                    key={m.id}
                    onClick={() => setSelected(m.id)}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px',
                      background: 'var(--surface)',
                      border: isSelected ? '1.5px solid #e8751a' : '1.5px solid var(--border)',
                      borderRadius: 14,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {/* Radio */}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      border: isSelected ? '6px solid #e8751a' : '2px solid #cbd5e1',
                      flexShrink: 0, transition: 'border 0.15s',
                    }} />

                    {/* Logo */}
                    {m.type === 'cash' ? <CashLogo /> : <CardLogo logo={m.logo!} />}

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: isSelected ? '#e8751a' : 'var(--text)' }}>
                        {m.label}
                      </p>
                      {m.last4 && (
                        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>**** {m.last4}</p>
                      )}
                      {m.type === 'cash' && (
                        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                          {lang === 'uz' ? 'Yetkazib berishda to\'lash' : 'Оплата при получении'}
                        </p>
                      )}
                    </div>

                    {/* Delete (only cards, only selected) */}
                    {isSelected && m.type === 'card' && (
                      <button
                        onClick={e => { e.stopPropagation(); removeMethod(m.id) }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: 4, display: 'flex', alignItems: 'center',
                          color: '#94a3b8',
                        }}
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </SubPageShell>
  )
}

function NotificationsPage({ lang }: { lang: Language }) {
  const title = lang === 'uz' ? 'Xabarnomalar' : 'Уведомления'
  const [orderNotif, setOrderNotif] = useState(true)
  const [promoNotif, setPromoNotif] = useState(false)

  return (
    <SubPageShell title={title}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NotifRow
          label={lang === 'uz' ? 'Buyurtma holati' : 'Статус заказа'}
          desc={lang === 'uz' ? 'Buyurtma yetib kelganda xabar oling' : 'Уведомления о статусе заказа'}
          enabled={orderNotif}
          onChange={setOrderNotif}
        />
        <NotifRow
          label={lang === 'uz' ? 'Aksiyalar va chegirmalar' : 'Акции и скидки'}
          desc={lang === 'uz' ? 'Yangi aksiyalar haqida xabardor bo\'ling' : 'Узнавайте о новых акциях'}
          enabled={promoNotif}
          onChange={setPromoNotif}
        />
      </div>
    </SubPageShell>
  )
}


function NotifRow({ label, desc, enabled, onChange }: {
  label: string; desc: string; enabled: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px',
      background: 'var(--surface)',
      borderRadius: 12,
      border: '1px solid var(--border)',
      marginBottom: 8,
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        style={{
          width: 48, height: 28,
          borderRadius: 14,
          background: enabled ? 'var(--accent, #e8751a)' : 'var(--surface-2)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 22, height: 22,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: enabled ? 22 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }} />
      </button>
    </div>
  )
}

export function ProfilePage({ sub }: ProfilePageProps = {}) {
  const navigate = useNavigate()
  const { language, setLanguage } = useLangStore()
  const { user, clear: clearAuth } = useAuthStore()
  const { clearCart } = useCartStore()
  const { setDeliveryType } = useDeliveryStore()
  const displayUser = BYPASS_MODE ? mockUser : user

  const isAdmin = window.Telegram?.WebApp?.initDataUnsafe?.user?.id === 638384527 || import.meta.env.VITE_BYPASS_AUTH === 'true'

  const [showLangPicker, setShowLangPicker] = useState(false)

  if (sub === 'personal-info') return <PersonalInfoPage lang={language} />
  if (sub === 'addresses') return <AddressesPage lang={language} />
  if (sub === 'payments') return <PaymentsPage lang={language} />
  if (sub === 'notifications') return <NotificationsPage lang={language} />

  const handleLogout = () => {
    clearAuth()
    clearCart()
    setDeliveryType(null)
    navigate('/welcome', { replace: true })
  }

  const menuItems = [
    { icon: <User size={20} strokeWidth={1.8} />, label: language === 'uz' ? "Mening ma'lumotlarim" : 'Мои данные', action: () => navigate('/profile/personal-info') },
    { icon: <MapPin size={20} strokeWidth={1.8} />, label: language === 'uz' ? 'Manzillarim' : 'Мои адреса', action: () => navigate('/profile/addresses') },
    { icon: <CreditCard size={20} strokeWidth={1.8} />, label: language === 'uz' ? "To'lov usullari" : 'Способы оплаты', action: () => navigate('/profile/payments') },
    { icon: <Bell size={20} strokeWidth={1.8} />, label: language === 'uz' ? 'Xabarnomalar' : 'Уведомления', action: () => navigate('/profile/notifications') },
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
