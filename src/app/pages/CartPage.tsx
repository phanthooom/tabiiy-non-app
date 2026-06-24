import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { cartApi } from '@/app/api'
import { Button, ProductPhoto, Spinner, Stepper } from '@/app/components/ui'
import { queryKeys, STALE_TIME } from '@/shared/lib/query-keys'
import { useCartStore, useLangStore } from '@/app/store'
import { useT } from '@/shared/utils/i18n'
import { useTelegram } from '@/shared/hooks/useTelegram'
import { useWorkingHours } from '@/shared/hooks/useWorkingHours'
import { BYPASS_MODE } from '@/shared/lib/mock-data'
import type { Cart } from '@/shared/types'

export function CartPage() {
  const { cart, setCart } = useCartStore()
  const { language } = useLangStore()
  const t = useT(language)
  const navigate = useNavigate()
  const { tg } = useTelegram()
  const queryClient = useQueryClient()
  const { isOpen, workStart, workEnd } = useWorkingHours()
  const { isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: queryKeys.cart(),
    queryFn: () => {
      if (BYPASS_MODE) return Promise.resolve(cart ?? { items: [], total: 0, items_count: 0 })
      return cartApi.get().then(c => { setCart(c); return c })
    },
    staleTime: STALE_TIME.cart,
    retry: false,
  })

  const syncCartCache = (newCart: Cart) => {
    setCart(newCart)
    queryClient.setQueryData(queryKeys.cart(), newCart)
  }

  const buildUpdatedCart = (pid: number | string, qty: number) => {
    const items = (cart?.items ?? [])
      .map(i => i.product_id === pid ? { ...i, quantity: qty, subtotal: i.price * qty } : i)
      .filter(i => i.quantity > 0)
    const total = items.reduce((s, i) => s + i.subtotal, 0)
    return { items, total, items_count: items.reduce((s, i) => s + i.quantity, 0) }
  }

  const updateMutation = useMutation({
    mutationFn: ({ pid, qty }: { pid: number | string; qty: number }) => {
      if (BYPASS_MODE) return Promise.resolve(buildUpdatedCart(pid, qty))
      return cartApi.updateItem(pid, qty)
    },
    onSuccess: syncCartCache,
  })

  const removeMutation = useMutation({
    mutationFn: (pid: number | string) => {
      if (BYPASS_MODE) {
        const items = (cart?.items ?? []).filter(i => String(i.product_id) !== String(pid))
        const total = items.reduce((s, i) => s + i.subtotal, 0)
        return Promise.resolve({ items, total, items_count: items.reduce((s, i) => s + i.quantity, 0) })
      }
      return cartApi.removeItem(pid)
    },
    onSuccess: (newCart) => {
      syncCartCache(newCart)
      tg?.HapticFeedback.impactOccurred('light')
    },
  })

  const clearMutation = useMutation({
    mutationFn: () => {
      if (BYPASS_MODE) {
        return Promise.resolve()
      }
      return cartApi.clear()
    },
    onSuccess: () => {
      const empty = { items: [], total: 0, items_count: 0 }
      syncCartCache(empty)
      tg?.HapticFeedback.impactOccurred('medium')
    },
  })

  const mutationPending = updateMutation.isPending || removeMutation.isPending || clearMutation.isPending

  if (isError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '48px 24px 100px', gap: 16, textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-2)', fontWeight: 600 }}>{t('error')}</p>
        <Button onClick={() => { void refetch() }} loading={isFetching}>
          {language === 'uz' ? 'Qayta urinish' : 'Повторить'}
        </Button>
      </div>
    )
  }

  if (isLoading && cart === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner size={40} />
      </div>
    )
  }

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 20px', gap: 16,
        textAlign: 'center',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: 48,
          background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 40 }}>🛒</span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{t('emptyCart')}</p>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 12 }}>
          {language === 'uz' ? 'Savatda hozircha hech narsa yo\'q' : 'В корзине пока ничего нет'}
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/')}
          style={{
            background: '#e8751a', color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 16,
            fontFamily: 'var(--font-body)', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(232, 117, 26, 0.2)',
          }}
        >
          {t('menu')}
        </motion.button>
      </div>
    )
  }

  const subtotal = cart?.total ?? 0
  const deliveryFee: number = 0

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
          {language === 'uz' ? 'Savat' : 'Корзина'}
        </p>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => clearMutation.mutate()}
          disabled={mutationPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: '1px solid #fca5a5',
            borderRadius: 10, padding: '7px 12px',
            color: '#ef4444', fontSize: 13, fontWeight: 600,
            cursor: mutationPending ? 'not-allowed' : 'pointer',
            opacity: mutationPending ? 0.5 : 1,
            fontFamily: 'var(--font-body)',
          }}
        >
          <Trash2 size={14} strokeWidth={2.5} />
          {language === 'uz' ? 'Tozalash' : 'Очистить'}
        </motion.button>
      </div>

      {/* Cart items */}
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.product_id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '12px',
              marginBottom: 12,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            {/* Photo */}
            <div style={{
              width: 56, height: 56,
              borderRadius: 12,
              background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
            }}>
              {item.image_url
                ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : item.photo_file_id
                  ? <ProductPhoto fileId={item.photo_file_id} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 24 }}>🍞</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 16, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {language === 'uz' ? (item.product_name_uz || item.product_name) : item.product_name}
              </p>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                {item.subtotal.toLocaleString('ru-RU')} {t('sum')}
              </p>
            </div>

            {/* Stepper */}
            <Stepper
              value={item.quantity}
              onInc={() => updateMutation.mutate({ pid: item.product_id, qty: item.quantity + 1 })}
              onDec={() => {
                if (item.quantity === 1) {
                  removeMutation.mutate(item.product_id)
                } else {
                  updateMutation.mutate({ pid: item.product_id, qty: item.quantity - 1 })
                }
              }}
              min={0}
              disabled={mutationPending}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Order Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '20px 24px',
          marginTop: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <p style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 20 }}>
          {language === 'uz' ? 'Buyurtma xulosasi' : 'Итог заказа'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>
            {language === 'uz' ? 'Jami' : 'Сумма'}
          </span>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
            {subtotal.toLocaleString('ru-RU')} {t('sum')}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>
            {language === 'uz' ? 'Yetkazib berish' : 'Доставка'}
          </span>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
            {language === 'uz' ? 'Yetkazib berish' : 'Доставка'}
          </span>
        </div>

        <div style={{ height: 1, background: '#e2e8f0', marginBottom: 16 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
            {t('total')}
          </span>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
            {(subtotal + deliveryFee).toLocaleString('ru-RU')} {t('sum')}
          </span>
        </div>

        {!isOpen && (
          <div style={{
            background: '#1e1b18', borderRadius: 10, padding: '10px 14px',
            marginBottom: 12, textAlign: 'center', border: '1px solid #3d3022',
          }}>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              🌙 {language === 'uz'
                ? `Ish vaqti: ${workStart}:00 – ${workEnd}:00`
                : `Работаем: ${workStart}:00 – ${workEnd}:00`}
            </p>
          </div>
        )}
        <motion.button
          whileTap={isOpen ? { scale: 0.96 } : {}}
          onClick={() => isOpen && navigate('/checkout')}
          style={{
            width: '100%',
            background: isOpen ? '#e8751a' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '14px',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            cursor: isOpen ? 'pointer' : 'not-allowed',
            opacity: isOpen ? 1 : 0.7,
          }}
        >
          {isOpen
            ? (language === 'uz' ? 'Buyurtma berish' : 'Оформить заказ')
            : (language === 'uz' ? 'Hozircha yopiq' : 'Сейчас закрыто')}
        </motion.button>
      </motion.div>
    </div>
  )
}
