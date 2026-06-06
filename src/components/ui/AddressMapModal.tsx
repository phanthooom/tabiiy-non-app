import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { YMaps, Map as YandexMap } from '@pbe/react-yandex-maps'
import { MapPin, ArrowLeft, LocateFixed, Loader2, Plus, Minus } from 'lucide-react'
import { useLangStore } from '@/store'

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
  const [locating, setLocating] = useState(false)
  const mapRef = useRef<any>(null)
  const ymapsRef = useRef<any>(null)
  const timerRef = useRef<any>(null)

  const centerRef = useRef(TASHKENT_CENTER)
  const detectingLabel = language === 'uz' ? 'Manzil aniqlanmoqda...' : 'Определение адреса...'

  const fetchAddress = useCallback(async (coords: number[]) => {
    if (!ymapsRef.current) return
    setIsFetching(true)
    try {
      // Allow any kind of result (house, street, district) so it doesn't fail
      const res = await ymapsRef.current.geocode(coords, { results: 1 })
      const firstGeoObject = res.geoObjects.get(0)
      if (firstGeoObject) {
        let addr = firstGeoObject.getAddressLine()
        // Optional: Remove "Узбекистан, Ташкент, " prefix to make it shorter and cleaner
        addr = addr.replace('Узбекистан, Ташкент, ', '').replace('Oʻzbekiston, Toshkent, ', '')
        setAddress(addr)
      } else {
        setAddress(`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`)
      }
    } catch (err) {
      setAddress(`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`)
    } finally {
      setIsFetching(false)
    }
  }, [])

  const handleBoundsChange = (e: any) => {
    const newCenter = e.get('newCenter')
    centerRef.current = newCenter
    if (timerRef.current) clearTimeout(timerRef.current)
    setAddress(detectingLabel)
  }

  const handleDragEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchAddress(centerRef.current), 350)
  }

  const handleLoad = (ymaps: any) => {
    ymapsRef.current = ymaps
    fetchAddress(TASHKENT_CENTER)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        centerRef.current = [lat, lon]
        if (mapRef.current) {
          mapRef.current.setCenter([lat, lon], 16, { duration: 400 })
        }
        fetchAddress([lat, lon])
        setLocating(false)
      },
      () => {
        setLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleZoom = (delta: number) => {
    if (mapRef.current) {
      const newZoom = mapRef.current.getZoom() + delta
      mapRef.current.setZoom(newZoom, { duration: 200 })
    }
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
          }}
        >
          {/* Map */}
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* @ts-expect-error Yandex Maps supports uz_UZ but react-yandex-maps types do not */}
            <YMaps query={{ apikey: apiKey, lang: language === 'uz' ? 'uz_UZ' : 'ru_RU', load: 'package.full' }}>
              <YandexMap
                defaultState={{ center: TASHKENT_CENTER, zoom: 16 }}
                width="100%"
                height="100%"
                onLoad={handleLoad}
                instanceRef={mapRef}
                onBoundsChange={handleBoundsChange}
                onActionEnd={handleDragEnd}
                options={{
                  suppressMapOpenBlock: true,
                  yandexMapDisablePoiInteractivity: true,
                  controls: [], // Отключаем все стандартные элементы управления Яндекса
                }}
              />
            </YMaps>
          </div>

          {/* Top Bar Floating */}
          <div style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 60px)', // Pushed down further
            left: 16,
            right: 16,
            display: 'flex',
            alignItems: 'flex-start', // Align to top in case text wraps
            gap: 12,
            zIndex: 10,
          }}>
            <button
              onClick={onClose}
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: '#ffffff',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={22} color="#0f172a" />
            </button>
            <div style={{
              flex: 1,
              background: '#ffffff',
              borderRadius: 20,
              padding: '12px 16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              fontSize: 14,
              fontWeight: 600,
              color: address === detectingLabel ? '#64748b' : '#0f172a',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {address}
            </div>
          </div>

          {/* Map Controls */}
          <div style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 130px)',
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            zIndex: 10,
          }}>
            <button
              onClick={detectLocation}
              disabled={locating}
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: '#ffffff',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                cursor: locating ? 'wait' : 'pointer',
              }}
            >
              {locating ? <Loader2 size={22} color="#e8751a" className="spinner" /> : <LocateFixed size={22} color="#e8751a" />}
            </button>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              borderRadius: 22,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}>
              <button
                onClick={() => handleZoom(1)}
                style={{
                  width: 44, height: 44,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Plus size={22} color="#0f172a" />
              </button>
              <button
                onClick={() => handleZoom(-1)}
                style={{
                  width: 44, height: 44,
                  background: 'transparent',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Minus size={22} color="#0f172a" />
              </button>
            </div>
          </div>

          {/* Central Pin */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 10,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}>
            <MapPin size={46} color="#e8751a" fill="#fff6ef" />
          </div>

          {/* Save Button */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
            zIndex: 10,
          }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={isFetching || address === detectingLabel || !address}
              onClick={() => {
                onConfirm(address)
                onClose()
              }}
              style={{
                width: '100%',
                background: '#e8751a',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '16px',
                fontWeight: 700,
                fontSize: 16,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                opacity: (isFetching || address === detectingLabel || !address) ? 0.7 : 1,
              }}
            >
              {language === 'uz' ? 'Tasdiqlash' : 'Подтвердить'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
