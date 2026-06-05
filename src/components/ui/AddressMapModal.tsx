import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { YMaps, Map as YandexMap } from '@pbe/react-yandex-maps'
import { MapPin, ArrowLeft } from 'lucide-react'
import { useLangStore } from '@/store'
import { Button } from './index'

interface AddressMapModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (address: string) => void
  apiKey: string
}

const TASHKENT_CENTER = [41.2995, 69.2401]

export function AddressMapModal({ isOpen, onClose, onConfirm, apiKey }: AddressMapModalProps) {
  const { language } = useLangStore()
  const [address, setAddress] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const mapRef = useRef<any>(null)
  const ymapsRef = useRef<any>(null)

  // Use a ref to store center to avoid constant re-renders during drag
  const centerRef = useRef(TASHKENT_CENTER)

  const fetchAddress = useCallback(async (coords: number[]) => {
    if (!ymapsRef.current) return
    setIsFetching(true)
    try {
      const res = await ymapsRef.current.geocode(coords)
      const firstGeoObject = res.geoObjects.get(0)
      if (firstGeoObject) {
        // You can use .getAddressLine() or build a custom string
        const addr = firstGeoObject.getAddressLine()
        // Strip out "Uzbekistan, Tashkent, " etc to keep it short if needed
        // For now, let's just use the full string or local string
        setAddress(addr)
      } else {
        setAddress(language === 'uz' ? 'Manzil topilmadi' : 'Адрес не найден')
      }
    } catch (err) {
      console.error('Geocode error', err)
      setAddress(language === 'uz' ? 'Xatolik yuz berdi' : 'Произошла ошибка')
    } finally {
      setIsFetching(false)
    }
  }, [language])

  const handleBoundsChange = (e: any) => {
    const newCenter = e.get('newCenter')
    centerRef.current = newCenter
    // Optionally wait for drag end to fetch address
  }

  const handleDragEnd = () => {
    fetchAddress(centerRef.current)
  }

  // When map loads
  const handleLoad = (ymaps: any) => {
    ymapsRef.current = ymaps
    fetchAddress(TASHKENT_CENTER) // Fetch initial center
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: 'env(safe-area-inset-top, 0px) 16px 16px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            height: 'calc(64px + env(safe-area-inset-top, 0px))',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)'
          }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={24} color="#0f172a" />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {language === 'uz' ? 'Manzilni tanlang' : 'Выберите адрес'}
            </h2>
          </div>

          {/* Map Area */}
          <div style={{ flex: 1, position: 'relative' }}>
            {/* @ts-expect-error Yandex Maps supports uz_UZ but react-yandex-maps types do not */}
            <YMaps query={{ apikey: apiKey, lang: language === 'uz' ? 'uz_UZ' : 'ru_RU' }}>
              <YandexMap
                defaultState={{ center: TASHKENT_CENTER, zoom: 14 }}
                width="100%"
                height="100%"
                onLoad={handleLoad}
                instanceRef={mapRef}
                onBoundsChange={handleBoundsChange}
                onActionEnd={handleDragEnd} // actionend fires when drag ends
                options={{
                  suppressMapOpenBlock: true,
                  yandexMapDisablePoiInteractivity: true,
                }}
              />
            </YMaps>

            {/* Central Pin (Fixed in center) */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -100%)', // align bottom of pin to center
              pointerEvents: 'none',
              zIndex: 10,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}>
              <MapPin size={40} color="#e8751a" fill="#fff6ef" />
            </div>
          </div>

          {/* Bottom Panel */}
          <div style={{
            padding: '24px 16px calc(24px + env(safe-area-inset-bottom, 0px))',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
            zIndex: 11
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {language === 'uz' ? 'Yetkazib berish manzili' : 'Адрес доставки'}
            </p>
            
            <div style={{ minHeight: 48, display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              {isFetching ? (
                <div className="spinner" style={{ width: 24, height: 24, borderTopColor: '#e8751a' }} />
              ) : (
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                  {address || (language === 'uz' ? 'Xarita bo\'ylab suring' : 'Передвигайте карту')}
                </h3>
              )}
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={isFetching || !address}
              onClick={() => {
                onConfirm(address)
                onClose()
              }}
              style={{
                background: '#e8751a',
                borderRadius: 8,
              }}
            >
              {language === 'uz' ? 'Tasdiqlash' : 'Подтвердить'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
