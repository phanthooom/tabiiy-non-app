import { useState, useRef, useEffect, useCallback } from 'react'
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
const MOVE_THRESHOLD = 0.00008 // ~8 metres — ignore micro-jitter from Telegram WebApp

export function AddressMapModal({ isOpen, onClose, onConfirm, apiKey }: AddressMapModalProps) {
  const { language } = useLangStore()
  const [address, setAddress] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [locating, setLocating] = useState(false)

  const mapRef       = useRef<any>(null)
  const timerRef     = useRef<any>(null)
  const reqIdRef     = useRef(0)
  const centerRef    = useRef(TASHKENT_CENTER)
  const resolvedPosRef = useRef<number[] | null>(null) // last successfully resolved position

  const lang = language === 'uz'
  const detectingLabel = lang ? 'Manzil aniqlanmoqda...' : 'Определение адреса...'
  const fallbackLabel  = lang ? 'Tanlangan manzil'       : 'Выбранная локация'

  // ── Watchdog: if isFetching stuck > 12s, force-release ──────────────────
  useEffect(() => {
    if (!isFetching) return
    const id = setTimeout(() => {
      setAddress(prev => (prev === detectingLabel || !prev) ? fallbackLabel : prev)
      setIsFetching(false)
    }, 12000)
    return () => clearTimeout(id)
  }, [isFetching, detectingLabel, fallbackLabel])

  // ── Core geocoding: all three methods run in PARALLEL ───────────────────
  const fetchAddress = useCallback(async (coords: number[]) => {
    const reqId = ++reqIdRef.current
    setIsFetching(true)
    const [lat, lon] = coords

    // 1. Yandex Maps SDK  (window.ymaps — always available once SDK loads, no ref timing)
    const ymapsGeocodeP = (): Promise<string> => new Promise((resolve, reject) => {
      const ymaps = (window as any).ymaps
      if (!ymaps?.geocode) { reject(new Error('no ymaps')); return }
      const timer = setTimeout(() => reject(new Error('timeout')), 8000)
      ymaps.geocode([lat, lon], { results: 1 })
        .then((res: any) => {
          clearTimeout(timer)
          const obj = res?.geoObjects?.get(0)
          const name = (obj?.properties?.get('name') || '') as string
          const desc = (obj?.properties?.get('description') || '') as string
          const full = [name, desc].filter(Boolean).join(', ')
          full ? resolve(full) : reject(new Error('empty'))
        })
        .catch(() => { clearTimeout(timer); reject(new Error('ymaps failed')) })
    })

    // 2. Nominatim — build clean address from address components
    const nominatimP = (): Promise<string> => new Promise((resolve, reject) => {
      const ctrl = new AbortController()
      const timer = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')) }, 5000)
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': lang ? 'uz' : 'ru' }, signal: ctrl.signal },
      )
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => {
          clearTimeout(timer)
          const a = d?.address
          if (a) {
            const parts = [
              a.road || a.pedestrian || a.footway || a.street,
              a.house_number,
              a.suburb || a.neighbourhood || a.quarter,
              a.city || a.town || a.village || a.municipality,
            ].filter(Boolean) as string[]
            if (parts.length >= 2) { resolve(parts.join(', ')); return }
          }
          d?.display_name ? resolve(d.display_name) : reject(new Error('empty'))
        })
        .catch(() => { clearTimeout(timer); reject(new Error('nominatim failed')) })
    })

    // 3. Yandex REST geocode
    const yandexRestP = (): Promise<string> => new Promise((resolve, reject) => {
      const ctrl = new AbortController()
      const timer = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')) }, 5000)
      fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lon},${lat}&format=json&lang=${lang ? 'uz_UZ' : 'ru_RU'}`,
        { signal: ctrl.signal },
      )
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => {
          clearTimeout(timer)
          const item = d?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
          const text = item?.metaDataProperty?.GeocoderMetaData?.text || item?.name
          text ? resolve(text) : reject(new Error('empty'))
        })
        .catch(() => { clearTimeout(timer); reject(new Error('yandex rest failed')) })
    })

    // Race: all three in parallel → first success wins. If all fail → fallback
    const winner = await Promise.race([
      // Promise.any: first resolved wins; polyfill-safe via race+catch
      (Promise as any).any
        ? (Promise as any).any([ymapsGeocodeP(), nominatimP(), yandexRestP()]).catch(() => fallbackLabel)
        : Promise.race([ymapsGeocodeP(), nominatimP(), yandexRestP()]).catch(() => fallbackLabel),
      // Hard outer timeout (watchdog useEffect is the real backstop)
      new Promise<string>(res => setTimeout(() => res(fallbackLabel), 10000)),
    ])

    if (reqId !== reqIdRef.current) return  // stale: user already moved map

    resolvedPosRef.current = [lat, lon]
    setAddress(winner as string)
    setIsFetching(false)
  }, [language, apiKey, fallbackLabel, lang])

  // ── Map event handlers ───────────────────────────────────────────────────
  const handleBoundsChange = (e: any) => {
    const newCenter = e.get('newCenter') as number[]
    centerRef.current = newCenter

    // Only reset address label if map actually moved a meaningful distance
    const prev = resolvedPosRef.current
    const moved = !prev
      || Math.abs(newCenter[0] - prev[0]) > MOVE_THRESHOLD
      || Math.abs(newCenter[1] - prev[1]) > MOVE_THRESHOLD

    if (moved) setAddress(detectingLabel)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchAddress(newCenter), 600)
  }

  const handleLoad = () => {
    // SDK loaded — kick off initial geocode (window.ymaps now available)
    fetchAddress(centerRef.current)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        centerRef.current = [lat, lon]
        if (mapRef.current) mapRef.current.setCenter([lat, lon], 16, { duration: 400 })
        fetchAddress([lat, lon])
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  const handleZoom = (delta: number) => {
    if (mapRef.current) mapRef.current.setZoom(mapRef.current.getZoom() + delta, { duration: 200 })
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
            {/* @ts-expect-error uz_UZ supported at runtime */}
            <YMaps query={{ apikey: apiKey, lang: lang ? 'uz_UZ' : 'ru_RU', load: 'package.full' }}>
              <YandexMap
                defaultState={{ center: TASHKENT_CENTER, zoom: 16, controls: [] }}
                width="100%" height="100%"
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
                color: (isFetching || !address || address === detectingLabel) ? '#64748b' : '#0f172a',
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

            {/* Controls */}
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

              <div style={{
                display: 'flex', flexDirection: 'column',
                background: '#ffffff', borderRadius: 22,
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)', overflow: 'hidden',
              }}>
                <button onClick={() => handleZoom(1)} style={{ width: 44, height: 44, background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={22} color="#0f172a" />
                </button>
                <button onClick={() => handleZoom(-1)} style={{ width: 44, height: 44, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Minus size={22} color="#0f172a" />
                </button>
              </div>
            </div>
          </div>

          {/* Central pin */}
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
              onClick={() => { onConfirm(address); onClose() }}
              style={{
                width: '100%',
                background: canConfirm ? '#e8751a' : '#cbd5e1',
                color: '#fff', border: 'none', borderRadius: 16, padding: '16px',
                fontWeight: 700, fontSize: 16,
                fontFamily: 'var(--font-body)',
                cursor: canConfirm ? 'pointer' : 'not-allowed',
                boxShadow: canConfirm ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                transition: 'background 0.2s',
              }}
            >
              {lang ? 'Tasdiqlash' : 'Подтвердить'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
