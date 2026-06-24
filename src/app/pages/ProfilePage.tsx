import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, MapPin, Bell, Globe, LogOut, ChevronRight, Shield, ArrowLeft, Trash2,
  Phone, Mail, Save, Pencil, Home, Briefcase, Plus, Map
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useLangStore, useDeliveryStore, useCartStore, SavedAddress } from '@/app/store'
import { BYPASS_MODE, mockUser } from '@/shared/lib/mock-data'
import { AddressMapModal } from '@/app/components/ui/AddressMapModal'
import { firestoreUsers } from '@/shared/lib/firestore-service'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { Language } from '@/shared/types'

interface ProfilePageProps {
  sub?: 'personal-info' | 'addresses' | 'notifications'
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+998[0-9]{9}$/

function PersonalInfoPage({ lang }: { lang: Language }) {
  const { user } = useAuthStore()
  const displayUser = BYPASS_MODE ? mockUser : user
  const title = lang === 'uz' ? "Mening ma'lumotlarim" : 'Мои данные'
  const [name, setName] = useState(displayUser?.full_name ?? '')
  const [phone, setPhone] = useState(displayUser?.phone ?? '')
  const [email, setEmail] = useState(displayUser?.email ?? '' as string)
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(
    window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url ?? null
  )

  const validate = (): boolean => {
    let ok = true
    if (!name.trim() || name.trim().length < 2) {
      setNameError(lang === 'uz' ? 'Ism kamida 2 ta harf' : 'Имя не менее 2 символов')
      ok = false
    } else {
      setNameError('')
    }
    if (phone && !PHONE_RE.test(phone)) {
      setPhoneError(lang === 'uz' ? 'Format: +998XXXXXXXXX' : 'Формат: +998XXXXXXXXX')
      ok = false
    } else {
      setPhoneError('')
    }
    if (email && !EMAIL_RE.test(email)) {
      setEmailError(lang === 'uz' ? 'Email noto\'g\'ri formatda' : 'Неверный формат email')
      ok = false
    } else {
      setEmailError('')
    }
    return ok
  }

  const handleSave = async () => {
    if (!validate()) return
    if (!displayUser?.id) return
    setSaving(true)
    try {
      await firestoreUsers.upsert(Number(displayUser.id), {
        full_name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setEmailError(lang === 'uz' ? 'Xatolik yuz berdi' : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
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
          <div>
            <FormField
              label={lang === 'uz' ? 'Ism' : 'Имя'}
              icon={<User size={18} color={nameError ? '#ef4444' : '#475569'} strokeWidth={2} />}
              value={name}
              placeholder={lang === 'uz' ? 'Ismingizni kiriting' : 'Введите имя'}
              onChange={(v) => { setName(v); setNameError('') }}
              error={!!nameError}
            />
            {nameError && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6, paddingLeft: 4 }}>{nameError}</p>
            )}
          </div>
          <div>
            <FormField
              label={lang === 'uz' ? 'Telefon raqam' : 'Телефон'}
              icon={<Phone size={18} color={phoneError ? '#ef4444' : '#475569'} strokeWidth={2} />}
              value={phone}
              placeholder="+998901234567"
              onChange={(v) => { setPhone(v); setPhoneError('') }}
              error={!!phoneError}
              inputMode="tel"
            />
            {phoneError && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6, paddingLeft: 4 }}>{phoneError}</p>
            )}
          </div>
          <div>
            <FormField
              label={lang === 'uz' ? 'Elektron pochta' : 'Эл. почта'}
              icon={<Mail size={18} color={emailError ? '#ef4444' : '#475569'} strokeWidth={2} />}
              value={email}
              placeholder={lang === 'uz' ? 'Emailingizni kiriting' : 'Введите email'}
              onChange={(v) => { setEmail(v); setEmailError('') }}
              error={!!emailError}
              inputMode="email"
            />
            {emailError && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6, paddingLeft: 4 }}>
                {emailError}
              </p>
            )}
          </div>
        </div>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '16px',
            background: saved ? '#22c55e' : saving ? '#94a3b8' : '#e8751a',
            border: 'none', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
            transition: 'background 0.25s',
            opacity: saving ? 0.8 : 1,
          }}
        >
          {saving
            ? <span className="spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} />
            : <Save size={18} color="#fff" strokeWidth={2.5} />}
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>
            {saved
              ? (lang === 'uz' ? 'SAQLANDI ✓' : 'СОХРАНЕНО ✓')
              : saving
                ? (lang === 'uz' ? 'SAQLANMOQDA...' : 'СОХРАНЕНИЕ...')
                : (lang === 'uz' ? 'SAQLASH' : 'СОХРАНИТЬ')}
          </span>
        </motion.button>
      </div>
    </SubPageShell>
  )
}

function FormField({ label, icon, value, readOnly, placeholder, onChange, error, inputMode }: {
  label: string
  icon: React.ReactNode
  value: string
  readOnly?: boolean
  placeholder?: string
  onChange?: (v: string) => void
  error?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{label}</p>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: readOnly ? '#f8fafc' : '#fff',
        border: `1px solid ${error ? '#ef4444' : '#cbd5e1'}`,
        borderRadius: 12, padding: '14px 16px',
        boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}>
        <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
        <input
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={e => onChange?.(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 15, fontWeight: 400,
            color: readOnly ? '#94a3b8' : 'var(--text)',
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>
    </div>
  )
}

function AddressesPage({ lang }: { lang: Language }) {
  const title = lang === 'uz' ? 'Manzillarim' : 'Мои адреса'
  const { savedAddresses, removeAddress, setAddress, addAddress, updateAddress } = useDeliveryStore()
  const navigate = useNavigate()

  const [editingAddr, setEditingAddr] = useState<Partial<SavedAddress> | null>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)

  const getIcon = (type: string) => {
    if (type === 'home') return <Home size={22} color="#0f172a" />
    if (type === 'work') return <Briefcase size={22} color="#0f172a" />
    return <MapPin size={22} color="#0f172a" />
  }

  const handleSave = () => {
    if (!editingAddr?.address) return
    const addrToSave = {
      type: editingAddr.type || 'other',
      title: editingAddr.title || (lang === 'uz' ? 'Yangi manzil' : 'Новый адрес'),
      address: editingAddr.address,
      details: editingAddr.details || ''
    }
    if (editingAddr.id) {
      updateAddress(editingAddr.id, addrToSave)
    } else {
      addAddress(addrToSave)
    }
    setEditingAddr(null)
  }

  if (editingAddr) {
    return (
      <SubPageShell title={editingAddr.id ? (lang === 'uz' ? 'Manzilni tahrirlash' : 'Редактировать адрес') : (lang === 'uz' ? 'Yangi manzil' : 'Новый адрес')}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            {(['home', 'work', 'other'] as const).map(t => (
              <button
                key={t}
                onClick={() => setEditingAddr({ ...editingAddr, type: t, title: t === 'home' ? (lang === 'uz' ? 'Uy' : 'Дом') : t === 'work' ? (lang === 'uz' ? 'Ish' : 'Работа') : editingAddr.title })}
                style={{
                  flex: 1, padding: '12px 0',
                  background: editingAddr.type === t ? '#fff' : 'var(--surface-2)',
                  border: editingAddr.type === t ? '1.5px solid #e8751a' : '1px solid transparent',
                  borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: editingAddr.type === t ? '0 2px 8px rgba(232,117,26,0.1)' : 'none'
                }}
              >
                {getIcon(t)}
                <span style={{ fontSize: 13, fontWeight: 600, color: editingAddr.type === t ? '#e8751a' : '#64748b' }}>
                  {t === 'home' ? (lang === 'uz' ? 'Uy' : 'Дом') : t === 'work' ? (lang === 'uz' ? 'Ish' : 'Работа') : (lang === 'uz' ? 'Boshqa' : 'Другое')}
                </span>
              </button>
            ))}
          </div>

          <FormField
            label={lang === 'uz' ? 'Manzil nomi' : 'Название адреса'}
            icon={<Pencil size={18} color="#475569" strokeWidth={2} />}
            value={editingAddr.title || ''}
            placeholder={lang === 'uz' ? 'Masalan: Uy, Ish, Ota-onamnikida' : 'Например: Дом, Работа'}
            onChange={(v) => setEditingAddr({ ...editingAddr, title: v })}
          />

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              {lang === 'uz' ? 'Manzil' : 'Адрес'}
            </p>
            <div
              onClick={() => setIsMapOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff', border: '1px solid #cbd5e1',
                borderRadius: 12, padding: '14px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                cursor: 'pointer'
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}><Map size={18} color="#475569" /></span>
              <span style={{ flex: 1, fontSize: 15, color: editingAddr.address ? 'var(--text)' : '#94a3b8', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {editingAddr.address || (lang === 'uz' ? 'Xaritadan tanlang' : 'Выберите на карте')}
              </span>
              <ChevronRight size={18} color="#94a3b8" />
            </div>
          </div>

          <FormField
            label={lang === 'uz' ? 'Mo\'ljal / Kvartira' : 'Ориентир / Квартира'}
            icon={<MapPin size={18} color="#475569" strokeWidth={2} />}
            value={editingAddr.details || ''}
            placeholder={lang === 'uz' ? 'Masalan: 45-xonadon' : 'Например: кв. 45'}
            onChange={(v) => setEditingAddr({ ...editingAddr, details: v })}
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setEditingAddr(null)}
              style={{
                flex: 1, padding: '16px', background: 'var(--surface-2)', border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}
            >
              {lang === 'uz' ? 'BEKOR QILISH' : 'ОТМЕНА'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!editingAddr.address || !editingAddr.title}
              style={{
                flex: 1, padding: '16px', background: (!editingAddr.address || !editingAddr.title) ? '#cbd5e1' : '#e8751a', border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700, color: '#fff', cursor: (!editingAddr.address || !editingAddr.title) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)'
              }}
            >
              {lang === 'uz' ? 'SAQLASH' : 'СОХРАНИТЬ'}
            </motion.button>
          </div>
        </div>

        <AddressMapModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onConfirm={(addr) => {
            setEditingAddr({ ...editingAddr, address: addr })
          }}
          apiKey="fcd5b77b-d255-480e-b530-ec10724a2275"
        />
      </SubPageShell>
    )
  }

  return (
    <SubPageShell title={title}>
      <div style={{ padding: '16px' }}>
        
        {/* Add new address button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setEditingAddr({ type: 'home' })}
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
            {lang === 'uz' ? 'YANGI MANZIL QO\'SHISH' : 'ДОБАВИТЬ НОВЫЙ АДРЕС'}
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
                  onClick={(e) => { e.stopPropagation(); setEditingAddr(addr) }}
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

  const [isAdmin, setIsAdmin] = useState(import.meta.env.VITE_BYPASS_AUTH === 'true')
  const [showLangPicker, setShowLangPicker] = useState(false)

  useEffect(() => {
    const check = (tgId: number | undefined) => {
      if (!tgId) return
      getDoc(doc(db, 'settings', 'main')).then(snap => {
        if (!snap.exists()) return
        const ids: number[] = snap.data().admin_telegram_ids ?? []
        setIsAdmin(ids.includes(tgId))
      }).catch(() => {})
    }

    const immediate = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    if (immediate) {
      check(immediate)
    } else {
      // Fallback: Telegram SDK might not be fully ready at mount
      const t = setTimeout(() => {
        check(window.Telegram?.WebApp?.initDataUnsafe?.user?.id)
      }, 800)
      return () => clearTimeout(t)
    }
  }, [])

  if (sub === 'personal-info') return <PersonalInfoPage lang={language} />
  if (sub === 'addresses') return <AddressesPage lang={language} />
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
    { icon: <Bell size={20} strokeWidth={1.8} />, label: language === 'uz' ? 'Xabarnomalar' : 'Уведомления', action: () => navigate('/profile/notifications') },
    ...(isAdmin ? [{
      icon: <Shield size={20} strokeWidth={1.8} />,
      label: 'Admin paneli',
      action: () => navigate('/admin')
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
                      onClick={() => {
                        setLanguage(lang)
                        setShowLangPicker(false)
                        if (user?.id) firestoreUsers.setLanguage(Number(user.id), lang).catch(console.warn)
                      }}
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
          {language === 'uz' ? 'CHIQISH' : 'ВЫЙТИ'}
        </span>
      </motion.button>
    </div>
  )
}
