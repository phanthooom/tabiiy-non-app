import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cartApi, BASE_URL } from '@/api'
import { Button, ProductPhoto, Spinner, Stepper } from '@/components/ui'
import { queryKeys, STALE_TIME } from '@/lib/query-keys'
import { useCartStore, useLangStore } from '@/store'
import { useT } from '@/utils/i18n'
import { useTelegram } from '@/hooks/useTelegram'
import { BYPASS_MODE } from '@/lib/mock-data'

export function CartPage() {
  const { cart, setCart } = useCartStore()
  const { language } = useLangStore()
  const t = useT(language)
  const navigate = useNavigate()
  const { tg } = useTelegram()
  const queryClient = useQueryClient()

  const { isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: queryKeys.cart(),
    queryFn: ({ signal }) =>
      BYPASS_MODE
        ? Promise.resolve(cart ?? { items: [], total: 0, items_count: 0 })
        : cartApi.get({ signal }).then(c => { setCart(c); return c }),
    staleTime: STALE_TIME.cart,
    retry: false,
  })

  const syncCartCache = (newCart: Awaited<ReturnType<typeof cartApi.get>>) => {
    setCart(newCart)
    queryClient.setQueryData(queryKeys.cart(), newCart)
  }

  const buildUpdatedCart = (pid: number, qty: number) => {
    const items = (cart?.items ?? [])
      .map(i => i.product_id === pid ? { ...i, quantity: qty, subtotal: i.price * qty } : i)
      .filter(i => i.quantity > 0)
    const total = items.reduce((s, i) => s + i.subtotal, 0)
    return { items, total, items_count: items.length }
  }

  const updateMutation = useMutation({
    mutationFn: ({ pid, qty }: { pid: number; qty: number }) =>
      BYPASS_MODE ? Promise.resolve(buildUpdatedCart(pid, qty)) : cartApi.updateItem(pid, qty),
    onSuccess: syncCartCache,
  })

  const removeMutation = useMutation({
    mutationFn: (pid: number) => {
      if (BYPASS_MODE) {
        const items = (cart?.items ?? []).filter(i => i.product_id !== pid)
        const total = items.reduce((s, i) => s + i.subtotal, 0)
        return Promise.resolve({ items, total, items_count: items.length })
      }
      return cartApi.removeItem(pid)
    },
    onSuccess: (newCart) => {
      syncCartCache(newCart)
      tg?.HapticFeedback.impactOccurred('light')
    },
  })

  const mutationPending = updateMutation.isPending || removeMutation.isPending

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
        padding: '80px 20px', gap: 16,
      }}>
        <span style={{ fontSize: 72 }}>🛒</span>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-2)' }}>{t('emptyCart')}</p>
        <Button onClick={() => navigate('/')}>{t('menu')}</Button>
      </div>
    )
  }

  const subtotal = cart?.total ?? 0
  const deliveryFee: number = 0

  return (
    <div style={{ padding: '20px 16px 32px' }}>
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
              background: 'var(--surface)',
              borderRadius: 16,
              padding: '12px 14px',
              marginBottom: 12,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              border: '1px solid var(--border)',
            }}
          >
            {/* Photo */}
            <div style={{
              width: 64, height: 64,
              borderRadius: 12,
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {item.image_url
                ? <img src={item.image_url.startsWith('/static/') ? `${BASE_URL}${item.image_url}` : item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : item.photo_file_id
                  ? <ProductPhoto fileId={item.photo_file_id} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 30 }}>🍞</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.product_name}
              </p>
              <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
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
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 16px',
          marginTop: 8,
        }}
      >
        <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)', marginBottom: 16 }}>
          {language === 'uz' ? 'Buyurtma xulosasi' : 'Order Summary'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: 'var(--text-2)', fontSize: 15 }}>
            {language === 'uz' ? 'Jami' : 'Subtotal'}
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
            {subtotal.toLocaleString('ru-RU')} {t('sum')}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: 'var(--text-2)', fontSize: 15 }}>
            {language === 'uz' ? 'Yetkazib berish' : 'Delivery Fee'}
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
            {deliveryFee === 0
              ? (language === 'uz' ? 'Bepul' : '$0.00')
              : `${deliveryFee.toLocaleString('ru-RU')} ${t('sum')}`}
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--primary)' }}>
            {t('total')}
          </span>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--primary)' }}>
            {(subtotal + deliveryFee).toLocaleString('ru-RU')} {t('sum')}
          </span>
        </div>

        <Button fullWidth size="lg" onClick={() => navigate('/checkout')}>
          {language === 'uz' ? 'Buyurtma berish' : 'Proceed to Checkout'}
        </Button>
      </motion.div>
    </div>
  )
}
