import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, MapPin, ExternalLink, Package, Truck, CheckCircle, Clock } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'

const COURIER_PHONE = '+998940453900'
const COURIER_PHONE_DISPLAY = '+998 (94) 045-39-00'

const STEPS = [
  { key: 'preparing', label: 'Готовится', icon: Package },
  { key: 'onway',     label: 'В пути',    icon: Truck },
  { key: 'done',      label: 'Доставлен', icon: CheckCircle },
]

function statusToStep(status: string): number {
  if (['delivered'].includes(status)) return 2
  if (['courier_assigned'].includes(status)) return 1
  return 0
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    accepted:         'Принят',
    packing:          'Упаковывается',
    courier_assigned: 'Курьер в пути',
    ready:            'Готов',
    delivered:        'Доставлен',
    cancelled:        'Отменён',
  }
  return map[status] ?? status
}

export function TrackingPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, 'orders', id))
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  useEffect(() => {
    const t = setTimeout(() => setSheetOpen(true), 300)
    return () => clearTimeout(t)
  }, [])

  const step = order ? statusToStep(order.status) : 0
  const isCancelled = order?.status === 'cancelled'
  const yandexUrl = order?.yandex_tracking_url

  const address =
    typeof order?.address === 'string'
      ? order.address
      : order?.address?.full_address ?? order?.address?.street ?? ''

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a0f0a', overflow: 'hidden' }}>

      {/* Yandex Map embed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ position: 'absolute', inset: 0, bottom: 'calc(55vh - 24px)' }}
      >
        <iframe
          src="https://yandex.uz/map-widget/v1/?ll=69.234749%2C41.320463&z=16&pt=69.234749%2C41.320463%2Cpm2rdm&mode=whatshere"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          style={{ display: 'block', border: 'none' }}
          title="Карта"
        />
        {/* Yandex link overlay top-right */}
        {yandexUrl && (
          <motion.a
            href={yandexUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              position: 'absolute', top: 12, right: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.92)',
              borderRadius: 20, padding: '7px 13px',
              color: '#e8751a', fontSize: 12, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}
          >
            <ExternalLink size={12} />
            Трек Яндекс
          </motion.a>
        )}
      </motion.div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '12px 20px 40px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
              maxHeight: '55vh',
              overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: '#e2e8f0', margin: '0 auto 20px',
            }} />

            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                Загружаем...
              </div>
            ) : !order ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                Заказ не найден
              </div>
            ) : (
              <>
                {/* Order header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>Заказ #{order.id}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                      {isCancelled ? '❌ Отменён' : statusLabel(order.status)}
                    </p>
                  </div>
                  {!isCancelled && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: '#fff7ed', borderRadius: 10, padding: '6px 10px',
                    }}>
                      <Clock size={13} color="#e8751a" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#e8751a' }}>
                        15–25 мин
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress steps */}
                {!isCancelled && (
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0 }}>
                    {STEPS.map((s, i) => {
                      const active = i <= step
                      const current = i === step
                      const Icon = s.icon
                      return (
                        <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <motion.div
                              initial={false}
                              animate={{
                                background: active ? (current ? '#e8751a' : '#16a34a') : '#f1f5f9',
                                scale: current ? 1.1 : 1,
                              }}
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                              style={{
                                width: 36, height: 36, borderRadius: 18,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Icon size={17} color={active ? '#fff' : '#94a3b8'} strokeWidth={2} />
                            </motion.div>
                            <span style={{
                              fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
                              color: active ? (current ? '#e8751a' : '#16a34a') : '#94a3b8',
                            }}>
                              {s.label}
                            </span>
                          </div>
                          {i < 2 && (
                            <div style={{ flex: 1, height: 2, margin: '0 4px', marginTop: -16,
                              background: i < step ? '#16a34a' : '#e2e8f0',
                              transition: 'background 0.4s',
                            }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Address */}
                {address && (
                  <div style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    background: '#f8fafc', borderRadius: 12, padding: '12px 14px',
                    marginBottom: 16,
                  }}>
                    <MapPin size={16} color="#e8751a" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: 0 }}>
                      {address}
                    </p>
                  </div>
                )}

                {/* Call button */}
                <motion.a
                  href={`tel:${COURIER_PHONE}`}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: '#e8751a', color: '#fff',
                    borderRadius: 14, padding: '15px',
                    fontWeight: 700, fontSize: 16,
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(232,117,26,0.35)',
                  }}
                >
                  <Phone size={20} strokeWidth={2.5} />
                  {COURIER_PHONE_DISPLAY}
                </motion.a>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
