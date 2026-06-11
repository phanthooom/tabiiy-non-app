import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Store, LocateFixed, Loader2, ChevronDown } from 'lucide-react'
import { apiErrorMessage, ordersApi } from '@/api'
import { mutationRetryOptions, withRetry } from '@/lib/retry'
import { BYPASS_MODE } from '@/lib/mock-data'

import { queryKeys } from '@/lib/query-keys'
import { useCartStore, useDeliveryStore, useLangStore } from '@/store'
import { useT } from '@/utils/i18n'
import { useBackButton } from '@/hooks/useTelegram'
import { useTelegram } from '@/hooks/useTelegram'
import type { DeliveryType, Order } from '@/types'
import { AddressMapModal } from '@/components/ui/AddressMapModal'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { language } = useLangStore()
  const { cart, clearCart } = useCartStore()
  const { deliveryType: savedDeliveryType, address: savedAddress, savedAddresses } = useDeliveryStore()
  const t = useT(language)
  const { tg } = useTelegram()
  const queryClient = useQueryClient()
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(savedDeliveryType ?? 'delivery')
  const [address, setAddress] = useState(savedAddress)
  const [comment, setComment] = useState('')
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const idempotencyKey = useRef(crypto.randomUUID())

  const detectLocation = async () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        const resolveAddress = async (): Promise<string> => {
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': language === 'uz' ? 'uz' : 'ru' } }
            )
            if (resp.ok) {
              const data = await resp.json()
              if (data?.display_name) return data.display_name
            }
          } catch {}
          try {
            const res = await fetch(
              `https://geocode-maps.yandex.ru/1.x/?apikey=fcd5b77b-d255-480e-b530-ec10724a2275&geocode=${lon},${lat}&format=json&lang=${language === 'uz' ? 'uz_UZ' : 'ru_RU'}`
            )
            if (res.ok) {
              const data = await res.json()
              const item = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
              const text = item?.metaDataProperty?.GeocoderMetaData?.text || item?.name
              if (text) return text
            }
          } catch {}
          return ''
        }
        const resolved = await resolveAddress()
        if (resolved) setAddress(resolved)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  useBackButton(() => navigate('/cart'))

  const orderMutation = useMutation({
    mutationFn: () => {
      if (BYPASS_MODE) {
        return new Promise<Order>((resolve) =>
          setTimeout(() => resolve({ id: Math.floor(Math.random() * 10000), status: 'accepted', status_label: 'Принят', delivery_type: 'pickup', address: null, total_amount: 0, created_at: new Date().toISOString(), items: [], yandex_claim_id: null }), 800)
        )
      }
      return withRetry(
        async () => {
          // 1. Create order in backend (Telegram bot notification + Yandex delivery)
          const order = await ordersApi.create({
            delivery_type: deliveryType,
            address: deliveryType === 'delivery' ? address : undefined,
            address_comment: comment.trim() || undefined,
          })
          return order
        },
        mutationRetryOptions(idempotencyKey.current),
      )
    },
    onSuccess: (order) => {
      clearCart()
      queryClient.removeQueries({ queryKey: queryKeys.cart() })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders(1) })
      tg?.HapticFeedback.notificationOccurred('success')
      navigate(`/order-success/${order.id}`)
    },
    onError: (err: unknown) => {
      tg?.HapticFeedback.notificationOccurred('error')
      tg?.showAlert(apiErrorMessage(err, t('error')))
    },
  })

  const canSubmit =
    deliveryType === 'pickup' ||
    (deliveryType === 'delivery' && address.trim().length > 5)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '14px 16px',
    fontSize: 14,
    color: '#0f172a',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 800,
    marginBottom: 8,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#475569',
  }

  return (
    <div style={{ padding: '16px 16px 40px' }}>
      {/* Delivery type */}
      <label style={labelStyle}>{t('deliveryType')}</label>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {(['delivery', 'pickup'] as DeliveryType[]).map((type) => {
          const active = deliveryType === type
          const Icon = type === 'delivery' ? MapPin : Store
          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.96 }}
              onClick={() => setDeliveryType(type)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
                padding: '16px 12px',
                border: active ? '1px solid #e8751a' : '1px solid #e2e8f0',
                borderRadius: 8,
                background: active ? '#fff6ef' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={20} color={active ? '#e8751a' : '#0f172a'} />
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: active ? '#e8751a' : '#0f172a',
              }}>
                {t(type)}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Pickup info card */}
      <AnimatePresence>
        {deliveryType === 'pickup' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <div style={{
              background: '#fff6ef',
              border: '1px solid #fed7aa',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Store size={18} color="#e8751a" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>
                    Tabiiy Non
                  </p>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                    {language === 'uz'
                      ? "Samarqand Darvoza ko'chasi, 2/1"
                      : 'ул. Самарканд Дарвоза, 2/1'}
                  </p>
                </div>
              </div>
              <a
                href="https://yandex.ru/navi/org/tabiiy_non/129776015209?si=v82649gguzaktuhfb0bkqcznkm"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#e8751a', color: '#fff',
                  borderRadius: 8, padding: '10px 16px',
                  fontSize: 13, fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <MapPin size={14} color="#fff" />
                {language === 'uz' ? 'Yandex navigatorda ochish' : 'Открыть в Яндекс Навигаторе'}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address fields */}
      <AnimatePresence>
        {deliveryType === 'delivery' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <label style={labelStyle}>{t('address')}</label>
            
            {savedAddresses && savedAddresses.length > 0 && (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <select
                  value={savedAddresses.some(a => a.address === address) ? address : ''}
                  onChange={e => {
                    if (e.target.value !== '') {
                      setAddress(e.target.value)
                    }
                  }}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    paddingRight: 40,
                    cursor: 'pointer',
                    background: '#f8fafc',
                    fontWeight: 600,
                  }}
                >
                  <option value="" disabled>{language === 'uz' ? 'Saqlangan manzillardan tanlang' : 'Выберите из сохраненных адресов'}</option>
                  {savedAddresses.map(a => (
                    <option key={a.id} value={a.address}>{a.title} ({a.address.slice(0, 25)}{a.address.length > 25 ? '...' : ''})</option>
                  ))}
                </select>
                <ChevronDown size={18} color="#64748b" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={locating
                  ? (language === 'uz' ? 'Manzil aniqlanmoqda...' : 'Определение адреса...')
                  : t('addressPlaceholder')}
                style={{
                  ...inputStyle,
                  paddingRight: 88,
                  color: '#0f172a',
                }}
              />
              {/* GPS button */}
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                style={{
                  position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: locating ? 'wait' : 'pointer',
                  padding: 4, display: 'flex', alignItems: 'center', opacity: locating ? 0.5 : 1,
                }}
              >
                {locating
                  ? <Loader2 size={18} color="#e8751a" style={{ animation: 'spin 1s linear infinite' }} />
                  : <LocateFixed size={18} color="#e8751a" />}
              </button>
              {/* Map picker button */}
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <MapPin size={18} color="#e8751a" />
              </button>
            </div>
            {address && (
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                {language === 'uz' ? 'Aniqroq manzilni izohda qoldirishingiz mumkin' : 'Можете уточнить адрес в комментарии (квартира, подъезд)'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AddressMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={(addr) => setAddress(addr)}
        apiKey="fcd5b77b-d255-480e-b530-ec10724a2275"
      />

      <label style={labelStyle}>{t('comment')}</label>
      <textarea
        style={{ ...inputStyle, minHeight: 90, resize: 'none' }}
        placeholder={t('commentPlaceholder')}
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      {/* Order summary */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '24px',
        marginTop: 32,
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      }}>
        <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 20 }}>
          {language === 'uz' ? 'Buyurtma tarkibi' : 'Состав заказа'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {(cart?.items ?? []).map((item, i, arr) => (
            <div key={item.product_id} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 14,
              borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
              paddingBottom: i < arr.length - 1 ? 16 : 0,
            }}>
              <span style={{ color: '#0f172a', fontWeight: 500 }}>{item.product_name} × {item.quantity}</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.subtotal.toLocaleString('ru-RU')} {t('sum')}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#475569' }}>
          <span>{language === 'uz' ? 'Oraliq jami' : 'Сумма'}</span>
          <span style={{ fontWeight: 600 }}>{(cart?.total ?? 0).toLocaleString('ru-RU')} {t('sum')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13, color: '#475569' }}>
          <span>{language === 'uz' ? 'Yetkazib berish' : 'Доставка'}</span>
          <span style={{ fontWeight: 600 }}>0 {t('sum')}</span>
        </div>

        <div style={{ borderTop: '1px dashed #cbd5e1', marginBottom: 20 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{language === 'uz' ? 'Jami' : 'Итого'}</span>
          <span style={{ fontWeight: 800, color: '#e8751a', fontSize: 18 }}>
            {(cart?.total ?? 0).toLocaleString('ru-RU')} {t('sum')}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={!canSubmit || orderMutation.isPending}
          onClick={() => orderMutation.mutate()}
          style={{
              width: '100%',
            background: canSubmit ? '#e8751a' : '#cbd5e1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '14px',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {orderMutation.isPending && <span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} />}
          {t('placeOrder')}
        </motion.button>
      </div>
    </div>
  )
}
