import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Store } from 'lucide-react'
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
import { AddressText } from '@/components/ui/AddressText'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { language } = useLangStore()
  const { cart, clearCart } = useCartStore()
  const { deliveryType: savedDeliveryType, address: savedAddress } = useDeliveryStore()
  const t = useT(language)
  const { tg } = useTelegram()
  const queryClient = useQueryClient()
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(savedDeliveryType ?? 'delivery')
  const [address, setAddress] = useState(savedAddress)
  const [comment, setComment] = useState('')
  const [isMapOpen, setIsMapOpen] = useState(false)
  const idempotencyKey = useRef(crypto.randomUUID())

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
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => setIsMapOpen(true)}
            >
              <div style={{ ...inputStyle, paddingRight: 40, minHeight: 46, display: 'flex', alignItems: 'center' }}>
                {address ? (
                  <AddressText address={address} language={language} clickable={false} />
                ) : (
                  <span style={{ color: '#94a3b8' }}>{t('addressPlaceholder')}</span>
                )}
              </div>
              <MapPin
                size={18}
                color="#e8751a"
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
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
