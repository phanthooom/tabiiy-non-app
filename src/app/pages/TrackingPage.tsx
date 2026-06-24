import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, MapPin, ExternalLink, Package, Truck, CheckCircle } from 'lucide-react'
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
  if (status === 'delivered') return 2
  if (status === 'courier_assigned') return 1
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

function callPhone() {
  window.location.href = `tel:${COURIER_PHONE}`
}

export function TrackingPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    getDoc(doc(db, 'orders', id))
      .then(snap => { if (snap.exists()) setOrder({ id: snap.id, ...snap.data() }) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const t = setTimeout(() => setSheetOpen(true), 200)
    return () => clearTimeout(t)
  }, [])

  const step = statusToStep(order?.status ?? '')
  const isCancelled = order?.status === 'cancelled'
  const yandexUrl = order?.yandex_tracking_url
  const address = typeof order?.address === 'string'
    ? order.address
    : order?.address?.full_address ?? order?.address?.street ?? ''

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f0ebe5', overflow: 'hidden' }}>

      {/* Map — fills top area, stops above sheet */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '44vh' }}>
        <iframe
          src="https://yandex.uz/map-widget/v1/?ll=69.234749%2C41.320463&z=16&pt=69.234749%2C41.320463%2Cpm2rdm"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          style={{ display: 'block', border: 'none' }}
          title="Карта"
        />
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              padding: '8px 16px 32px',
              boxShadow: '0 -6px 32px rgba(0,0,0,0.18)',
              height: '44vh',
              overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{ width: 32, height: 3, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 12px' }} />

            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>Загружаем...</p>
            ) : !order ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>Заказ не найден</p>
            ) : (
              <>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 1 }}>Заказ #{order.id}</p>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                      {isCancelled ? '❌ Отменён' : statusLabel(order.status)}
                    </p>
                  </div>
                  {yandexUrl && (
                    <a
                      href={yandexUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: '#fff7ed', borderRadius: 10, padding: '5px 9px',
                        color: '#e8751a', fontSize: 11, fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={11} />
                      Яндекс
                    </a>
                  )}
                </div>

                {/* Progress steps */}
                {!isCancelled && (
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    {STEPS.map((s, i) => {
                      const active = i <= step
                      const current = i === step
                      const Icon = s.icon
                      return (
                        <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: 15,
                              background: active ? (current ? '#e8751a' : '#16a34a') : '#f1f5f9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: current ? '0 0 0 3px rgba(232,117,26,0.2)' : 'none',
                              transition: 'background 0.3s',
                            }}>
                              <Icon size={14} color={active ? '#fff' : '#94a3b8'} strokeWidth={2} />
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 600, color: active ? (current ? '#e8751a' : '#16a34a') : '#94a3b8' }}>
                              {s.label}
                            </span>
                          </div>
                          {i < 2 && (
                            <div style={{
                              flex: 1, height: 2, margin: '0 3px', marginTop: -12,
                              background: i < step ? '#16a34a' : '#e2e8f0', transition: 'background 0.4s',
                            }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Address */}
                {address ? (
                  <div style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    background: '#f8fafc', borderRadius: 10, padding: '8px 10px', marginBottom: 10,
                  }}>
                    <MapPin size={13} color="#e8751a" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.45, margin: 0 }}>{address}</p>
                  </div>
                ) : <div style={{ marginBottom: 10 }} />}

                {/* Call button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={callPhone}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#e8751a', color: '#fff', border: 'none',
                    borderRadius: 12, padding: '13px',
                    fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxShadow: '0 3px 14px rgba(232,117,26,0.35)',
                  }}
                >
                  <Phone size={17} strokeWidth={2.5} />
                  {COURIER_PHONE_DISPLAY}
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
