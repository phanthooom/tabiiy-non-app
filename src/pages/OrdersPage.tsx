import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Clock, MapPin, Phone } from 'lucide-react'
import { YMaps, Map as YandexMap } from '@pbe/react-yandex-maps'

import { Button, Spinner } from '@/components/ui'
import { BYPASS_MODE, mockOrders } from '@/lib/mock-data'
import { ordersApi } from '@/api'

import { useLangStore } from '@/store'
import { useT } from '@/utils/i18n'
import { useBackButton } from '@/hooks/useTelegram'
import type { Order } from '@/types'

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

function OrderCard({ order, onClick, language }: { order: Order; onClick: () => void; language: string }) {
  const t = useT(language as 'ru' | 'uz')
  const badge = STATUS_BADGE[order.status]
  const progress = STATUS_PROGRESS[order.status] ?? 0
  const isActive = ACTIVE_STATUSES.has(order.status)
  const firstItem = order.items[0]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
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
        <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
          #TN-{order.id}
        </span>
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
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'right', fontWeight: 500 }}>
            {language === 'uz' ? 'Taxminiy vaqt: 45 min' : 'Est. Delivery: 45 mins'}
          </p>
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
            <img 
              src="https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&auto=format&fit=crop" 
              alt="Bread"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
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

      {/* Track order button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onClick}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13, fontWeight: 700,
            color: '#0f172a',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {language === 'uz' ? 'Kuzatish' : 'Track Order'}
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
        {language === 'uz' ? 'Mening buyurtmalarim' : 'My Orders'}
      </motion.h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: 20,
      }}>
        <button style={tabStyle(tab === 'active')} onClick={() => setTab('active')}>
          {language === 'uz' ? 'Faol' : 'Active'}
        </button>
        <button style={tabStyle(tab === 'history')} onClick={() => setTab('history')}>
          {language === 'uz' ? 'Tarix' : 'History'}
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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', background: '#f8fafc' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {/* @ts-expect-error Yandex Maps supports uz_UZ but react-yandex-maps types do not */}
        <YMaps query={{ apikey: 'fcd5b77b-d255-480e-b530-ec10724a2275', lang: language === 'uz' ? 'uz_UZ' : 'ru_RU' }}>
          <YandexMap
            defaultState={{ center: [41.3111, 69.2401], zoom: 12, controls: [] }}
            width="100%"
            height="100%"
            options={{ suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }}
          />
        </YMaps>
      </div>

      {/* Bottom Card */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
        style={{ 
        position: 'absolute', 
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)', 
        left: 16, right: 16, zIndex: 10, 
        background: '#ffffff', borderRadius: 20, padding: 20, 
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)' 
      }}>
        {(() => {
          const step = order.status === 'yakunlandi' ? 3 : order.status === 'yolda' ? 2 : 1;
          const statusTextUz = step === 3 ? 'Yetkazildi' : step === 2 ? 'Yetkazib berishda' : 'Tayyorlanmoqda';
          const statusTextRu = step === 3 ? 'Доставлено' : step === 2 ? 'В доставке' : 'Готовится';
          return (
            <p style={{ fontSize: 11, fontWeight: 800, color: '#e8751a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {language === 'uz' ? statusTextUz : statusTextRu}
            </p>
          )
        })()}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {order.status !== 'yakunlandi' ? (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>15-20 {language === 'uz' ? 'daqiqa' : 'минут'}</h2>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff6ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#e8751a" strokeWidth={2.5} />
              </div>
            </>
          ) : (
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#10b981', margin: 0 }}>{language === 'uz' ? 'Yetkazib berildi' : 'Успешно доставлено'}</h2>
          )}
        </div>

        {/* Progress Bar */}
        {(() => {
          const step = order.status === 'yakunlandi' ? 3 : order.status === 'yolda' ? 2 : 1;
          return (
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <div style={{ height: 4, flex: 1, background: step >= 1 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
              <div style={{ height: 4, flex: 1, background: step >= 2 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
              <div style={{ height: 4, flex: 1, background: step >= 3 ? '#e8751a' : '#e2e8f0', borderRadius: 2 }} />
            </div>
          )
        })()}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 20 }}>
          <span>{language === 'uz' ? 'Tayyorlandi' : 'Готовится'}</span>
          <span style={{ textAlign: 'center' }}>{language === 'uz' ? "Yo'lda" : 'В пути'}</span>
          <span style={{ textAlign: 'right' }}>{language === 'uz' ? 'Yetkazildi' : 'Доставлен'}</span>
        </div>

        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 20 }} />

        {/* Courier Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop" alt="Courier" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 2 }}>Jasur</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              <span style={{ color: '#e8751a' }}>★ 4.9</span>
              <span>(120+)</span>
            </div>
          </div>
          <a href="tel:+998901234567" style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}>
            <Phone size={18} color="#0f172a" />
          </a>
        </div>

        {/* Address Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <MapPin size={20} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{language === 'uz' ? 'Yetkazib berish manzili' : 'Адрес доставки'}</p>
            <p style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, lineHeight: 1.4 }}>
              {order.address ? (
                /^\d+\.\d+,\s*\d+\.\d+$/.test(order.address)
                  ? (language === 'uz' ? '📍 Xaritadan belgilangan manzil' : '📍 Выбрано на карте')
                  : order.address
              ) : (language === 'uz' ? 'Manzil kiritilmagan' : 'Адрес не указан')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
