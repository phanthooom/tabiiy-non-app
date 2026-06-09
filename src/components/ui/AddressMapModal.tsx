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

const fetchWithTimeout = (url: string, opts: RequestInit = {}, ms = 4000) => {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id))
}

export function AddressMapModal({ isOpen, onClose, onConfirm, apiKey }: AddressMapModalProps) {
  const { language } = useLangStore()
  const [address, setAddress] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [locating, setLocating] = useState(false)
  const mapRef = useRef<any>(null)
  const ymapsRef = useRef<any>(null)
  const timerRef = useRef<any>(null)
  const hardTimeoutRef = useRef<any>(null)
  const centerRef = useRef(TASHKENT_CENTER)

  const detectingLabel = language === 'uz' ? 'Manzil aniqlanmoqda...' : 'Определение адреса...'
  const fallbackLabel  = language === 'uz' ? 'Tanlangan manzil' : 'Выбранная локация'

  const fetchAddress = useCallback(async (coords: number[]) => {
    setIsFetching(true)
    const [lat, lon] = coords

    // Cancel any previous hard timeout
    if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current)

    // Hard failsafe: 8 seconds → force-set fallback so button is never stuck
    hardTimeoutRef.current = setTimeout(() => {
      setAddress(prev => (prev === detectingLabel || !prev) ? fallbackLabel : prev)
      setIsFetching(false)
      hardTimeoutRef.current = null
    }, 8000)

    const resolveAddress = async (): Promise<string> => {
      // ── 1. Yandex ymaps SDK geocode (first — already loaded, no CORS) ──
      if (ymapsRef.current) {
        try {
          const res = await Promise.race<any>([
            ymapsRef.current.geocode([lat, lon], { results: 1 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500)),
          ])
          const obj = res?.geoObjects?.get(0)
          const name = obj?.getAddressLine?.() || obj?.properties?.get('text')
          if (name) return name
        } catch { /* skip */ }
      }

      // ── 2. Nominatim (OpenStreetMap) ──
      try {
        const resp = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': language === 'uz' ? 'uz' : 'ru' } },
          4000,
        )
        if (resp.ok) {
          const data = await resp.json()
          if (data?.display_name) return data.display_name
        }
      } catch { /* skip */ }

      // ── 3. Yandex REST geocode ──
      try {
        const res = await fetchWithTimeout(
          `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lon},${lat}&format=json&lang=${language === 'uz' ? 'uz_UZ' : 'ru_RU'}`,
          {},
          4000,
        )
        if (res.ok) {
          const data = await res.json()
          const item = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
          const text = item?.metaDataProperty?.GeocoderMetaData?.text || item?.name
          if (text) return text
        }
      } catch { /* skip */ }

      // ── All failed: return fallback so button is never disabled ──
      return fallbackLabel
    }

    try {
      const text = await resolveAddress()
      if (hardTimeoutRef.current) {
        clearTimeout(hardTimeoutRef.current)
        hardTimeoutRef.current = null
        setAddress(text)
        setIsFetching(false)
      }
      // If hardTimeout already fired — don't overwrite with stale result
    } catch {
      if (hardTimeoutRef.current) {
        clearTimeout(hardTimeoutRef.current)
        hardTimeoutRef.current = null
        setAddress(fallbackLabel)
        setIsFetching(false)
      }
    }
  }, [language, apiKey, detectingLabel, fallbackLabel])

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
    fetchAddress(centerRef.current)
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
      () => { setLocating(false) },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  const handleZoom = (delta: number) => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + delta, { duration: 200 })
    }
  }

  const canConfirm = !isFetching && !!address && address !== detectingLabel

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#ffffff' }}
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
                options={{ suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }}
              />
            </YMaps>
          </div>

          {/* Floating UI */}
          <div style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 60px)',
            left: 16, right: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
            zIndex: 10, pointerEvents: 'none',
          }}>
            {/* Top bar */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, pointerEvents: 'auto' }}>
              <button
                onClick={onClose}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: '#ffffff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <ArrowLeft size={22} color="#0f172a" />
              </button>
              <div style={{
                flex: 1, background: '#ffffff', borderRadius: 20, padding: '12px 16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                fontSize: 14, fontWeight: 600, lineHeight: 1.4,
                color: (!address || address === detectingLabel) ? '#64748b' : '#0f172a',
                minHeight: 48, display: 'flex', alignItems: 'center',
              }}>
                {isFetching ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                    <Loader2 size={16} color="#e8751a" style={{ animation: 'spin 1s linear infinite' }} />
                    {detectingLabel}
                  </span>
                ) : (
                  address || detectingLabel
                )}
              </div>
            </div>

            {/* Map controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'auto' }}>
              <button
                onClick={detectLocation}
                disabled={locating}
                style={{
                  width: 44, height: 44, borderRadius: '50%', background: '#ffffff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)', cursor: locating ? 'wait' : 'pointer',
                }}
              >
                {locating
                  ? <Loader2 size={22} color="#e8751a" style={{ animation: 'spin 1s linear infinite' }} />
                  : <LocateFixed size={22} color="#e8751a" />}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                <button
                  onClick={() => handleZoom(1)}
                  style={{ width: 44, height: 44, background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Plus size={22} color="#0f172a" />
                </button>
                <button
                  onClick={() => handleZoom(-1)}
                  style={{ width: 44, height: 44, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Minus size={22} color="#0f172a" />
                </button>
              </div>
            </div>
          </div>

          {/* Central Pin */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none', zIndex: 10,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          }}>
            <MapPin size={46} color="#e8751a" fill="#fff6ef" />
          </div>

          {/* Confirm button */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
            zIndex: 10,
          }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!canConfirm}
              onClick={() => {
                onConfirm(address)
                onClose()
              }}
              style={{
                width: '100%',
                background: canConfirm ? '#e8751a' : '#cbd5e1',
                color: '#fff',
                border: 'none', borderRadius: 16, padding: '16px',
                fontWeight: 700, fontSize: 16,
                fontFamily: 'var(--font-body)',
                cursor: canConfirm ? 'pointer' : 'not-allowed',
                boxShadow: canConfirm ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                transition: 'background 0.2s',
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
