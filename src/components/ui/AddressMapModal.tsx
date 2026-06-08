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
    const [lat, lon] = coords

    const resolveAddress = async () => {
      // Primary: Nominatim (OpenStreetMap)
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': language === 'uz' ? 'uz' : 'ru' } }
        )
        if (resp.ok) {
          const data = await resp.json()
          if (data && data.display_name) {
            return data.display_name
          }
        }
      } catch {}

      // Fallback: Yandex REST
      try {
        const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lon},${lat}&format=json&lang=${language === 'uz' ? 'uz_UZ' : 'ru_RU'}`)
        if (res.ok) {
          const data = await res.json()
          const item = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
          const text = item?.metaDataProperty?.GeocoderMetaData?.text || item?.name
          if (text) {
            return text
          }
        }
      } catch {}

      // Final fallback: Ymaps geocode
      try {
        const res = await ymapsRef.current.geocode(coords, { results: 1 })
        const obj = res.geoObjects.get(0)
        const name = obj?.getAddressLine?.() || obj?.properties?.get('text')
        if (name) return name
      } catch {}

      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
    }

    const text = await resolveAddress()
    setAddress(text)
    setIsFetching(false)
  }, [language, apiKey])

  const handleBoundsChange = (e: any) => {
    const newCenter = e.get('newCenter')
    centerRef.current = newCenter
    setAddress(detectingLabel)
    
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetchAddress(newCenter)
    }, 600)
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
                defaultState={{ center: TASHKENT_CENTER, zoom: 16, controls: [] }}
                width="100%"
                height="100%"
                onLoad={handleLoad}
                instanceRef={mapRef}
                onBoundsChange={handleBoundsChange}
                options={{
                  suppressMapOpenBlock: true,
                  yandexMapDisablePoiInteractivity: true,
                }}
              />
            </YMaps>
          </div>

          {/* Floating UI Overlay */}
          <div style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 60px)',
            left: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 12,
            zIndex: 10,
            pointerEvents: 'none',
          }}>
            {/* Top Bar Floating */}
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              pointerEvents: 'auto',
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
              }}>
                {address}
              </div>
            </div>

            {/* Map Controls */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              pointerEvents: 'auto',
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
