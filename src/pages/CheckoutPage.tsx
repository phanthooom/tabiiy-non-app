import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Store } from 'lucide-react'
import { ordersApi, apiErrorMessage } from '@/api'
import { mutationRetryOptions, withRetry } from '@/lib/retry'
import { Button } from '@/components/ui'
import { queryKeys } from '@/lib/query-keys'
import { useCartStore, useDeliveryStore, useLangStore } from '@/store'
import { useT } from '@/utils/i18n'
import { useBackButton } from '@/hooks/useTelegram'
import { useTelegram } from '@/hooks/useTelegram'
import type { DeliveryType } from '@/types'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { language } = useLangStore()
  const { cart, clearCart } = useCartStore()
  const { deliveryType: savedDeliveryType } = useDeliveryStore()
  const t = useT(language)
  const { tg } = useTelegram()
  const queryClient = useQueryClient()

  const [deliveryType, setDeliveryType] = useState<DeliveryType>(savedDeliveryType ?? 'delivery')
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const idempotencyKey = useRef(crypto.randomUUID())

  useBackButton(() => navigate('/cart'))

  const orderMutation = useMutation({
    mutationFn: () =>
      withRetry(
        () =>
          ordersApi.create({
            delivery_type: deliveryType,
            address: deliveryType === 'delivery' ? address : undefined,
            address_comment: comment || undefined,
          }, {
            headers: { 'Idempotency-Key': idempotencyKey.current },
          }),
        mutationRetryOptions(idempotencyKey.current),
      ),
    onSuccess: (order) => {
      clearCart()
      queryClient.removeQueries({ queryKey: queryKeys.cart() })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
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
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
    fontSize: 15,
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ padding: '16px 16px 140px' }}>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 24 }}
      >
        {t('checkout')}
      </motion.h1>

      {/* Delivery type */}
      <p style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-2)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {t('deliveryType')}
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
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
                border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                background: active ? 'var(--accent-light)' : 'var(--surface)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={22} color={active ? 'var(--accent)' : 'var(--text-3)'} />
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: active ? 'var(--accent)' : 'var(--text-2)',
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
            style={{ overflow: 'hidden', marginBottom: 16 }}
          >
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-2)' }}>
              {t('address')}
            </label>
            <input
              style={inputStyle}
              placeholder={t('addressPlaceholder')}
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-2)' }}>
        {t('comment')}
      </label>
      <textarea
        style={{ ...inputStyle, minHeight: 80, resize: 'none' }}
        placeholder={t('commentPlaceholder')}
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      {/* Order summary */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        marginTop: 20,
      }}>
        <p style={{ fontWeight: 700, marginBottom: 10 }}>
          {language === 'uz' ? 'Buyurtma tarkibi' : 'Состав заказа'}
        </p>
        {(cart?.items ?? []).map(item => (
          <div key={item.product_id} style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 8, fontSize: 14,
          }}>
            <span style={{ color: 'var(--text-2)' }}>{item.product_name} × {item.quantity}</span>
            <span style={{ fontWeight: 600 }}>{item.subtotal.toLocaleString('ru-RU')} {t('sum')}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700 }}>{t('total')}</span>
          <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>
            {(cart?.total ?? 0).toLocaleString('ru-RU')} {t('sum')}
          </span>
        </div>
      </div>

      {/* Submit button */}
      <div style={{
        position: 'fixed', bottom: 'var(--nav-height)',
        left: 0, right: 0,
        padding: '12px 16px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
      }}>
        <Button
          fullWidth size="lg"
          disabled={!canSubmit}
          loading={orderMutation.isPending}
          onClick={() => orderMutation.mutate()}
        >
          {t('placeOrder')}
        </Button>
      </div>
    </div>
  )
}
