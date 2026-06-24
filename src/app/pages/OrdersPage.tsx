import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, MapPin, Phone, Store } from 'lucide-react'
import { YMaps, Map as YandexMap, Placemark } from '@pbe/react-yandex-maps'

import { Button, Spinner, ProductPhoto } from '@/app/components/ui'
import { AddressText } from '@/app/components/ui/AddressText'
import { BYPASS_MODE, mockOrders } from '@/shared/lib/mock-data'
import { ordersApi } from '@/app/api'

import { useLangStore } from '@/app/store'
import { useT } from '@/shared/utils/i18n'
import { useBackButton } from '@/shared/hooks/useTelegram'
import type { Order } from '@/shared/types'

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useLangStore()
  const t = useT(language)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '80dvh', padding: '20px 24px', textAlign: 'center',
    }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <CheckCircle size={80} color="var(--accent)" strokeWidth={1.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 700,
          color: 'var(--primary)',
          marginTop: 20, marginBottom: 10,
        }}>
          {t('orderSuccess')}
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, marginBottom: 8 }}>
          {t('orderSuccessText')}
        </p>
        {id && (
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>#{id}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <Button variant="ghost" onClick={() => navigate('/orders')}>
          {t('orders')}
        </Button>
        <Button onClick={() => navigate('/')}>
          {t('menu')}
        </Button>
      </motion.div>
    </div>
  )
}

// ── Status helpers ────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(['accepted', 'packing', 'courier_assigned', 'ready'])
const STATUS_BADGE: Record<string, { bg: string; color: string; label: Record<string, string> }> = {
  accepted:         { bg: '#fff3e0', color: '#E67E22', label: { uz: 'QABUL', ru: 'ПРИНЯТ' } },
  packing:          { bg: '#fff3e0', color: '#E67E22', label: { uz: 'YOPILMOQDA', ru: 'УПАКОВКА' } },
  courier_assigned: { bg: '#e3f2fd', color: '#1976d2', label: { uz: 'KURYER', ru: 'КУРЬЕР' } },
  ready:            { bg: '#e8f5e9', color: '#388e3c', label: { uz: 'TAYYOR', ru: 'ГОТОВ' } },
  delivered:        { bg: '#e8f5e9', color: '#388e3c', label: { uz: 'YETKAZILDI', ru: 'ДОСТАВЛЕН' } },
  cancelled:        { bg: '#fce4ec', color: '#c62828', label: { uz: 'BEKOR', ru: 'ОТМЕНЁН' } },
}

const STATUS_PROGRESS: Record<string, number> = {
  accepted: 25,
  packing: 50,
  courier_assigned: 75,
  ready: 80,
  delivered: 100,
  cancelled: 0,
}

const PICKUP_PROGRESS: Record<string, number> = {
  accepted: 33,
  packing: 66,
  ready: 100,
  delivered: 100,
  cancelled: 0,
}

function OrderCard({ order, onClick, language }: { order: Order; onClick: () => void; language: string }) {
  const t = useT(language as 'ru' | 'uz')
  const badge = STATUS_BADGE[order.status]
  const isPickup = order.delivery_type === 'pickup'
  const progress = isPickup
    ? (PICKUP_PROGRESS[order.status] ?? 0)
    : (STATUS_PROGRESS[order.status] ?? 0)
  const isActive = ACTIVE_STATUSES.has(order.status)
  const firstItem = order.items[0]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#ffffff',
        border: isPickup ? '1px solid #fed7aa' : '1px solid #e2e8f0',
        borderRadius: 16,
        marginBottom: 16,
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
            #TN-{order.id}
          </span>
          {isPickup && (
            <span style={{
              fontSize: 10, fontWeight: 800,
              color: '#e8751a',
              background: '#fff6ef',
              borderRadius: 6,
              padding: '3px 7px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Store size={10} color="#e8751a" />
              {language === 'uz' ? "O'z olish" : 'Самовывоз'}
            </span>
          )}
        </div>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 800,
            color: badge.color,
            background: badge.bg,
            borderRadius: 6,
            padding: '4px 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {badge.label[language] ?? order.status_label}
          </span>
        )}
      </div>

      {/* Order title */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>
          {order.items.length > 0
            ? (order.items.length === 1 ? order.items[0].product_name : (language === 'uz' ? 'Tabiiy Non Buyurtmasi' : 'Заказ Tabiiy Non'))
            : (language === 'uz' ? 'Buyurtma' : 'Заказ')}
        </p>
      </div>

      {/* Progress bar (only for active orders) */}
      {isActive && (
        <div style={{ marginBottom: 16 }}>
          {isPickup ? (
            /* Pickup: 3-step segmented bar */
            <div style={{ display: 'flex', gap: 4 }}>
              {[33, 66, 100].map((threshold, i) => (
                <div key={i} style={{ height: 4, flex: 1, background: progress >= threshold ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
              ))}
            </div>
          ) : (
            <div style={{
              height: 4,
              background: '#e2e8f0',
              borderRadius: 99,
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: '#e8751a',
                  borderRadius: 99,
                }}
              />
            </div>
          )}
          {isPickup ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 6, fontWeight: 600 }}>
              <span>{language === 'uz' ? 'Tayyorlanmoqda' : 'Готовится'}</span>
              <span>{language === 'uz' ? 'Tayyor' : 'Готов'}</span>
              <span>{language === 'uz' ? 'Olingan' : 'Получен'}</span>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'right', fontWeight: 500 }}>
              {language === 'uz' ? 'Taxminiy vaqt: 45 min' : 'Примерно 45 мин'}
            </p>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: '#f1f5f9', marginBottom: 16 }} />

      {/* Items + total */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}>
        {/* Product image */}
        {firstItem && (
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: '#f8fafc', overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #f1f5f9',
          }}>
            {firstItem.image_url ? (
              <img src={firstItem.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : firstItem.photo_file_id ? (
              <ProductPhoto fileId={firstItem.photo_file_id} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28 }}>🍞</span>
            )}
          </div>
        )}

        {/* Items text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>
            {order.items.map(i => `${i.product_name} x${i.quantity}`).join('\n').split('\n').map((line, idx) => (
              <span key={idx} style={{ display: 'block' }}>{line}</span>
            ))}
          </p>
        </div>

        {/* Total */}
        <p style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', flexShrink: 0 }}>
          {order.total_amount.toLocaleString('ru-RU')} {t('sum')}
        </p>
      </div>

      {/* Action button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onClick}
          style={{
            background: isPickup ? '#fff6ef' : '#ffffff',
            border: isPickup ? '1px solid #fed7aa' : '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13, fontWeight: 700,
            color: isPickup ? '#e8751a' : '#0f172a',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {isPickup && <Store size={13} color="#e8751a" />}
          {isPickup
            ? (language === 'uz' ? 'Batafsil' : 'Подробнее')
            : (language === 'uz' ? 'Kuzatish' : 'Отследить')}
        </button>
      </div>
    </motion.div>
  )
}

// ── Orders List ───────────────────────────────────────────────────────────

export function OrdersPage() {
  const { language } = useLangStore()
  const t = useT(language)
  const navigate = useNavigate()
  const [tab, setTab] = useState<'active' | 'history'>('active')

  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (BYPASS_MODE) {
      setAllOrders(mockOrders)
      setIsLoading(false)
      return
    }
    
    try {
      const unsubscribe = ordersApi.subscribe((orders) => {
        setAllOrders(orders)
        setIsLoading(false)
        setIsError(false)
      })
      return () => unsubscribe()
    } catch (e) {
      console.error(e)
      setIsError(true)
      setIsLoading(false)
    }
  }, [])
  const activeOrders = allOrders.filter((o: Order) => ACTIVE_STATUSES.has(o.status))
  const historyOrders = allOrders.filter((o: Order) => !ACTIVE_STATUSES.has(o.status))
  const visibleOrders = tab === 'active' ? activeOrders : historyOrders

  if (isError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '48px 24px 100px', gap: 16, textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-2)', fontWeight: 600 }}>{t('error')}</p>
        <Button onClick={() => window.location.reload()}>
          {language === 'uz' ? 'Qayta urinish' : 'Повторить'}
        </Button>
      </div>
    )
  }

  if (isLoading && allOrders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner size={40} />
      </div>
    )
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #e8751a' : '2px solid transparent',
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 700,
    color: active ? '#e8751a' : '#64748b',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'all 0.18s',
  })

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}
      >
        {language === 'uz' ? 'Mening buyurtmalarim' : 'Мои заказы'}
      </motion.h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: 20,
      }}>
        <button style={tabStyle(tab === 'active')} onClick={() => setTab('active')}>
          {language === 'uz' ? 'Faol' : 'Активные'}
        </button>
        <button style={tabStyle(tab === 'history')} onClick={() => setTab('history')}>
          {language === 'uz' ? 'Tarix' : 'История'}
        </button>
      </div>

      {/* Order cards */}
      {visibleOrders.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px', gap: 16, textAlign: 'center',
        }}>
          <span style={{ fontSize: 56 }}>📦</span>
          <p style={{ color: 'var(--text-2)', fontSize: 16, fontWeight: 600 }}>
            {tab === 'active'
              ? (language === 'uz' ? 'Faol buyurtma yo\'q' : 'Нет активных заказов')
              : (language === 'uz' ? 'Buyurtmalar tarixi bo\'sh' : 'История заказов пуста')}
          </p>
          {tab === 'history' && (
            <Button onClick={() => navigate('/')}>{t('menu')}</Button>
          )}
        </div>
      ) : (
        visibleOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            language={language}
            onClick={() => navigate(`/orders/${order.id}`)}
          />
        ))
      )}
    </div>
  )
}

// ── Order Detail ──────────────────────────────────────────────────────────

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useLangStore()
  const t = useT(language)

  useBackButton(() => navigate('/orders'))

  const orderId = id ? (Number.isNaN(Number(id)) ? id : Number(id)) : null
  const idValid = orderId !== null

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.3111, 69.2401])
  const [mapZoom, setMapZoom] = useState(12)
  const [pinCoords, setPinCoords] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!idValid) return
    if (BYPASS_MODE) {
      setOrder(mockOrders.find(o => o.id === orderId) ?? mockOrders[0])
      setIsLoading(false)
      return
    }

    try {
      const unsubscribe = ordersApi.subscribeOne(orderId as number | string, (data) => {
        setOrder(data)
        setIsLoading(false)
        setIsError(false)
      })
      return () => unsubscribe()
    } catch (e) {
      console.error(e)
      setIsError(true)
      setIsLoading(false)
    }
  }, [idValid, orderId])

  // Geocode delivery address → map center + pin
  useEffect(() => {
    if (!order || (order as any).delivery_type === 'pickup') return
    const addr = typeof (order as any).address === 'string'
      ? (order as any).address
      : (order as any).address?.full_address ?? (order as any).address?.street ?? ''
    if (!addr) return
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr + ', Ташкент')}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data[0]) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          setMapCenter([lat, lng])
          setPinCoords([lat, lng])
          setTimeout(() => setMapZoom(17), 600)
        }
      })
      .catch(() => {})
  }, [order])

  if (!idValid) {
    return (
      <div style={{ padding: '24px 16px 100px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>{t('error')}</p>
        <Button onClick={() => navigate('/orders')}>{t('orders')}</Button>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '48px 24px 100px', gap: 16, textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-2)', fontWeight: 600 }}>{t('error')}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="ghost" onClick={() => navigate('/orders')}>{t('orders')}</Button>
          <Button onClick={() => window.location.reload()}>
            {language === 'uz' ? 'Qayta urinish' : 'Повторить'}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner size={40} />
      </div>
    )
  }

  const isPickup = order.delivery_type === 'pickup'

  if (isPickup) {
    const isCancelled = order.status === 'cancelled'
    const pickupStep = order.status === 'delivered' ? 3 : order.status === 'ready' ? 2 : 1
    const pickupStatusRu = isCancelled ? 'Заказ отменён' : pickupStep === 3 ? 'Получен' : pickupStep === 2 ? 'Готов к выдаче!' : 'Готовится...'
    const pickupStatusUz = isCancelled ? 'Buyurtma bekor qilindi' : pickupStep === 3 ? 'Olingan' : pickupStep === 2 ? "Olib ketishga tayyor!" : 'Tayyorlanmoqda...'
    const isDone = order.status === 'delivered'

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        {/* Store icon area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{
              width: 96, height: 96, borderRadius: '50%',
              background: isCancelled ? '#fef2f2' : isDone ? '#d1fae5' : '#fff6ef',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              boxShadow: isCancelled ? '0 4px 24px rgba(220,38,38,0.12)' : '0 4px 24px rgba(232,117,26,0.12)',
            }}
          >
            {isCancelled
              ? <span style={{ fontSize: 40 }}>✕</span>
              : isDone
                ? <CheckCircle size={48} color="#10b981" strokeWidth={1.5} />
                : <Store size={48} color="#e8751a" strokeWidth={1.5} />}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: 11, fontWeight: 800, color: isCancelled ? '#dc2626' : '#e8751a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}
          >
            {language === 'uz' ? "O'z olish" : 'Самовывоз'} · #TN-{order.id}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 26, fontWeight: 800, color: isCancelled ? '#dc2626' : isDone ? '#10b981' : '#0f172a', textAlign: 'center', marginBottom: 24 }}
          >
            {language === 'uz' ? pickupStatusUz : pickupStatusRu}
          </motion.h2>

          {/* 3-step progress (hidden if cancelled) */}
          {!isCancelled && (
            <div style={{ width: '100%', maxWidth: 320 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                <div style={{ height: 4, flex: 1, background: pickupStep >= 1 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
                <div style={{ height: 4, flex: 1, background: pickupStep >= 2 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
                <div style={{ height: 4, flex: 1, background: pickupStep >= 3 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                <span>{language === 'uz' ? 'Tayyorlanmoqda' : 'Готовится'}</span>
                <span>{language === 'uz' ? 'Tayyor' : 'Готов'}</span>
                <span>{language === 'uz' ? 'Olingan' : 'Получен'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom card */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            flexShrink: 0,
            background: isCancelled ? '#fff9f9' : '#ffffff',
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          }}
        >
          {isCancelled ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 700, marginBottom: 6 }}>
                {language === 'uz' ? 'Buyurtma bekor qilindi' : 'Заказ отменён'}
              </p>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                {language === 'uz'
                  ? "Savollar uchun Tabiiy Non bilan bog'laning"
                  : 'По вопросам обращайтесь в Tabiiy Non'}
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                {language === 'uz' ? "Do'kon manzili" : 'Адрес магазина'}
              </p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff6ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Store size={22} color="#e8751a" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 3 }}>Tabiiy Non</p>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                    {language === 'uz' ? "Samarqand Darvoza ko'chasi, 2/1" : 'ул. Самарканд Дарвоза, 2/1'}
                  </p>
                </div>
              </div>

              <a
                href="https://yandex.ru/navi/org/tabiiy_non/129776015209?si=v82649gguzaktuhfb0bkqcznkm"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#e8751a', color: '#fff',
                  borderRadius: 12, padding: '14px 16px',
                  fontSize: 14, fontWeight: 700,
                  textDecoration: 'none',
                  width: '100%',
                }}
              >
                <MapPin size={15} color="#fff" />
                {language === 'uz' ? 'Yandex navigatorda ochish' : 'Открыть в Яндекс Навигаторе'}
              </a>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', background: '#f8fafc' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {/* @ts-expect-error Yandex Maps supports uz_UZ but react-yandex-maps types do not */}
        <YMaps query={{ apikey: 'fcd5b77b-d255-480e-b530-ec10724a2275', lang: language === 'uz' ? 'uz_UZ' : 'ru_RU' }}>
          <YandexMap
            state={{ center: mapCenter, zoom: mapZoom, controls: [] }}
            width="100%"
            height="100%"
            options={{ suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }}
          >
            {pinCoords && (
              <Placemark
                geometry={pinCoords}
                options={{
                  preset: 'islands#redDotIcon',
                  iconColor: '#e8751a',
                }}
              />
            )}
          </YandexMap>
        </YMaps>
      </div>

      {/* Bottom Card */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
        style={{
        position: 'absolute',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        left: 16, right: 16, zIndex: 10,
        background: order.status === 'cancelled' ? '#fff9f9' : '#ffffff',
        borderRadius: 20, padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: order.status === 'cancelled' ? '1px solid #fca5a5' : 'none',
      }}>
        {order.status === 'cancelled' ? (
          /* ── Cancelled state ── */
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: 28, marginBottom: 10 }}>✕</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>
              {language === 'uz' ? 'Buyurtma bekor qilindi' : 'Заказ отменён'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              {language === 'uz'
                ? "Savollar uchun Tabiiy Non bilan bog'laning"
                : 'По вопросам обращайтесь в Tabiiy Non'}
            </p>
            {order.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, textAlign: 'left' }}>
                <MapPin size={16} color="#94a3b8" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                  <AddressText address={order.address} language={language} clickable={false} />
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── Active / delivered state ── */
          <>
            {/* Status + progress bar */}
            {(() => {
              const step = order.status === 'delivered' ? 3 : order.status === 'courier_assigned' ? 2 : 1;
              const statusRu = step === 3 ? 'Доставлено' : step === 2 ? 'В пути' : 'Готовится';
              const statusUz = step === 3 ? 'Yetkazildi' : step === 2 ? "Yo'lda" : 'Tayyorlanmoqda';
              return (
                <>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#e8751a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                    {language === 'uz' ? statusUz : statusRu}
                  </p>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <div style={{ height: 3, flex: 1, background: step >= 1 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
                    <div style={{ height: 3, flex: 1, background: step >= 2 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
                    <div style={{ height: 3, flex: 1, background: step >= 3 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>
                    <span>{language === 'uz' ? 'Tayyorlandi' : 'Готовится'}</span>
                    <span>{language === 'uz' ? "Yo'lda" : 'В пути'}</span>
                    <span>{language === 'uz' ? 'Yetkazildi' : 'Доставлен'}</span>
                  </div>
                </>
              )
            })()}

            {/* Call / track button */}
            {order.yandex_tracking_url ? (
              <a href={order.yandex_tracking_url} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#e8751a', color: '#fff', borderRadius: 12, padding: '11px 16px',
                fontSize: 14, fontWeight: 700, textDecoration: 'none', width: '100%', marginBottom: 10,
              }}>
                <MapPin size={15} color="#fff" />
                {language === 'uz' ? 'Yandex orqali kuzatish' : 'Отследить в Яндекс'}
              </a>
            ) : (
              <button onClick={() => {
                const a = document.createElement('a')
                a.href = 'tel:+998940453900'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
              }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#e8751a', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 16px',
                fontSize: 14, fontWeight: 700, width: '100%', marginBottom: 10,
                boxShadow: '0 3px 14px rgba(232,117,26,0.3)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Phone size={15} color="#fff" />
                +998 (94) 045-39-00
              </button>
            )}

            {/* Short address */}
            {order.address && (() => {
              const raw = typeof order.address === 'string' ? order.address : (order.address as any)?.full_address ?? (order.address as any)?.street ?? ''
              const short = raw.split(',').slice(0, 2).join(',').trim()
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {short}
                  </p>
                </div>
              )
            })()}
          </>
        )}
      </motion.div>
    </div>
  )
}
