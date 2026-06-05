import { useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { ArrowLeft, Crosshair, Map } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDeliveryStore } from '@/store'

const DEFAULT_ADDRESS = 'Toshkent shahar, Chilonzor tumani, Bunyodkor shoh ko\'chasi, 42-uy'

export function DeliveryLocationPage() {
  const navigate = useNavigate()
  const { setDeliveryType } = useDeliveryStore()
  const [address] = useState(DEFAULT_ADDRESS)
  const controls = useAnimation()

  const handleConfirm = () => {
    setDeliveryType('delivery')
    navigate('/', { replace: true })
  }

  const handleBack = () => {
    navigate('/welcome', { replace: true })
  }

  const handleDragEnd = (_event: any, info: any) => {
    if (info.offset.y > 100) {
      handleBack()
    } else {
      controls.start({ y: 0 })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f8fafc', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        height: '64px',
        background: '#f1f8f8',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <motion.button
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={handleBack}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 8, marginLeft: -8,
            display: 'flex', alignItems: 'center',
            color: '#0f172a',
          }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </motion.button>
        <span style={{ fontWeight: 600, fontSize: 18, color: '#0f172a' }}>
          Yetkazib berish manzili
        </span>
      </header>

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Dotted map background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: '#f1f5f9',
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }} />

        {/* Center pin */}
        <motion.div 
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.2}
          whileTap={{ scale: 1.1, cursor: "grabbing" }}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            cursor: 'grab',
            zIndex: 15
          }}>
          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: 13, fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 16,
              marginBottom: 8,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            Manzilni tanlang
          </motion.div>
          {/* Pin */}
          <svg width="28" height="36" viewBox="0 0 32 42" fill="none" style={{ pointerEvents: 'none' }}>
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10.67 14.4 25.217 15.027 25.855a1.333 1.333 0 001.946 0C17.6 41.217 32 26.67 32 16 32 7.163 24.837 0 16 0z" fill="#eb8628"/>
            <circle cx="16" cy="15" r="5" fill="#eb8628" stroke="#d47931" strokeWidth="2" opacity="0.8"/>
          </svg>
          {/* Shadow */}
          <div style={{ width: 14, height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: '50%', marginTop: 4, filter: 'blur(1px)', pointerEvents: 'none' }} />
        </motion.div>

        {/* Location button (bottom right) */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={{
            position: 'absolute', bottom: 16, right: 16,
            width: 44, height: 44,
            background: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 10
          }}
        >
          <Crosshair size={20} color="#0f172a" strokeWidth={2} />
        </motion.button>
      </div>

      {/* Bottom sheet */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 200 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ y: 80, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        style={{
          background: '#ffffff',
          borderRadius: '24px 24px 0 0',
          padding: '16px 20px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
          flexShrink: 0,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
          position: 'relative',
          zIndex: 20,
          touchAction: 'none'
        }}
      >
        {/* Grab handle */}
        <div style={{
          width: 36, height: 4,
          background: '#e2e8f0',
          borderRadius: 2,
          margin: '0 auto 20px',
        }} />

        {/* Address row */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'flex-start',
          marginBottom: 24,
        }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            style={{
              width: 44, height: 44,
              background: '#f1f8f8',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
            <Map size={20} color="#0f172a" strokeWidth={1.8} />
          </motion.div>
          <div style={{ paddingTop: 2 }}>
            <p style={{
              fontSize: 11, fontWeight: 600,
              color: '#64748b', letterSpacing: '0.04em',
              textTransform: 'uppercase', marginBottom: 6,
            }}>
              JORIY MANZIL
            </p>
            <p style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.5, fontWeight: 400 }}>
              {address}
            </p>
          </div>
        </div>

        {/* Confirm button */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={handleConfirm}
          style={{
            width: '100%',
            background: '#eb8628',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            padding: '16px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(235, 134, 40, 0.25)'
          }}
        >
          Manzilni tasdiqlash
        </motion.button>
      </motion.div>
    </div>
  )
}
