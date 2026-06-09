import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductCard, Button, Spinner } from '@/components/ui'
import { queryKeys, STALE_TIME } from '@/lib/query-keys'
import { productsApi, cartApi, apiErrorMessage } from '@/api'
import { useCartStore, useLangStore } from '@/store'
import { useT } from '@/utils/i18n'
import { useTelegram } from '@/hooks/useTelegram'
import { BYPASS_MODE, mockProducts } from '@/lib/mock-data'
import type { Product } from '@/types'

export function CatalogPage() {
  const { language } = useLangStore()
  const { cart, setCart } = useCartStore()
  const t = useT(language)
  const { tg } = useTelegram()
  const queryClient = useQueryClient()

  const { data: products, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => BYPASS_MODE ? Promise.resolve(mockProducts) : productsApi.list(),
    staleTime: STALE_TIME.products,
    retry: false,
  })

  const addMutation = useMutation({
    mutationFn: (product: Product) => {
      if (BYPASS_MODE) {
        const existingItem = cart?.items.find(i => i.product_id === product.id)
        const newItems = existingItem
          ? cart!.items.map(i => i.product_id === product.id
              ? { ...i, quantity: i.quantity + 1, subtotal: i.price * (i.quantity + 1) }
              : i)
          : [...(cart?.items ?? []), {
              product_id: product.id, product_name: product.name,
              price: product.price, quantity: 1, subtotal: product.price,
              photo_file_id: null, image_url: null,
            }]
        const total = newItems.reduce((s, i) => s + i.subtotal, 0)
        return Promise.resolve({ items: newItems, total, items_count: newItems.length })
      }
      return cartApi.addItem(product.id, 1)
    },
    onSuccess: (newCart) => {
      setCart(newCart)
      queryClient.setQueryData(queryKeys.cart(), newCart)
      tg?.HapticFeedback.notificationOccurred('success')
    },
    onError: (err: unknown) => {
      tg?.HapticFeedback.notificationOccurred('error')
      tg?.showAlert(apiErrorMessage(err, 'Ошибка добавления в корзину'))
    },
  })

  const removeMutation = useMutation({
    mutationFn: ({ product, qty }: { product: Product; qty: number }) => {
      if (BYPASS_MODE) {
        if (qty <= 1) {
          const newItems = (cart?.items ?? []).filter(i => i.product_id !== product.id)
          const total = newItems.reduce((s, i) => s + i.subtotal, 0)
          return Promise.resolve({ items: newItems, total, items_count: newItems.length })
        }
        const newItems = (cart?.items ?? []).map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity - 1, subtotal: i.price * (i.quantity - 1) }
            : i
        )
        const total = newItems.reduce((s, i) => s + i.subtotal, 0)
        return Promise.resolve({ items: newItems, total, items_count: newItems.length })
      }
      if (qty <= 1) return cartApi.removeItem(product.id)
      return cartApi.updateItem(product.id, qty - 1)
    },
    onSuccess: (newCart) => {
      setCart(newCart)
      queryClient.setQueryData(queryKeys.cart(), newCart)
      tg?.HapticFeedback.selectionChanged?.()
    },
    onError: (err: unknown) => {
      tg?.showAlert(apiErrorMessage(err, 'Ошибка'))
    },
  })

  // Optimistic set-qty: immediately update store, then sync to API
  const setQtyMutation = useMutation({
    mutationFn: ({ product, qty }: { product: Product; qty: number }) => {
      if (BYPASS_MODE) {
        if (qty === 0) {
          const newItems = (cart?.items ?? []).filter(i => i.product_id !== product.id)
          const total = newItems.reduce((s, i) => s + i.subtotal, 0)
          return Promise.resolve({ items: newItems, total, items_count: newItems.length })
        }
        const existingItem = cart?.items.find(i => i.product_id === product.id)
        const newItems = existingItem
          ? cart!.items.map(i => i.product_id === product.id
              ? { ...i, quantity: qty, subtotal: i.price * qty }
              : i)
          : [...(cart?.items ?? []), {
              product_id: product.id, product_name: product.name,
              price: product.price, quantity: qty, subtotal: product.price * qty,
              photo_file_id: null, image_url: null,
            }]
        const total = newItems.reduce((s, i) => s + i.subtotal, 0)
        return Promise.resolve({ items: newItems, total, items_count: newItems.length })
      }
      if (qty === 0) return cartApi.removeItem(product.id)
      return cartApi.updateItem(product.id, qty)
    },
    onSuccess: (newCart) => {
      setCart(newCart)
      queryClient.setQueryData(queryKeys.cart(), newCart)
    },
    onError: (err: unknown) => {
      tg?.showAlert(apiErrorMessage(err, 'Ошибка'))
    },
  })

  const handleAdd = (product: Product) => {
    const cartItem = cart?.items.find(i => i.product_id === product.id)
    if (cartItem && cartItem.quantity >= product.quantity) {
      tg?.HapticFeedback.notificationOccurred('error')
      tg?.showAlert(language === 'uz' ? 'Boshqa yo\'q!' : 'Больше нет на складе!')
      return
    }
    addMutation.mutate(product)
  }

  const handleRemove = (product: Product) => {
    const cartItem = cart?.items.find(i => i.product_id === product.id)
    if (!cartItem) return
    removeMutation.mutate({ product, qty: cartItem.quantity })
  }

  const handleSetQty = (product: Product, qty: number) => {
    setQtyMutation.mutate({ product, qty })
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 100px', gap: 16, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-2)', fontWeight: 600 }}>{t('error')}</p>
        <Button onClick={() => { void refetch() }} loading={isFetching}>
          {language === 'uz' ? 'Qayta urinish' : 'Повторить'}
        </Button>
      </div>
    )
  }

  if (isLoading && products === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner size={36} />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 12px 120px', background: '#f1f8f8', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, padding: '0 4px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em', marginBottom: 4 }}>
          {language === 'uz' ? 'Tabiiy va issiq' : 'Свежий и горячий'}
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
          {language === 'uz' ? 'O\'zingizga yoqqan nonni tanlang' : 'Выберите хлеб по вкусу'}
        </p>
      </div>

      {/* Single column list */}
      <AnimatePresence>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(products ?? []).map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ProductCard
                product={product}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onSetQty={handleSetQty}
                cartQty={cart?.items.find(x => x.product_id === product.id)?.quantity ?? 0}
                addLabel={t('addToCart')}
                outLabel={t('outOfStock')}
                sumLabel={t('sum')}
                addDisabled={addMutation.isPending}
                language={language}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {products?.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-2)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🍞</p>
          <p style={{ fontSize: 16, fontWeight: 500 }}>
            {language === 'uz' ? 'Hozircha mahsulot yo\'q' : 'Пока нет товаров'}
          </p>
        </div>
      )}
    </div>
  )
}
