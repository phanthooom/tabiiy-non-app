import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useDeliveryStore, useLangStore } from '@/app/store'
import type { DeliveryType } from '@/shared/types'
import { Bike, Store, Croissant } from 'lucide-react'

const T = {
  uz: {
    title:    'Xush kelibsiz',
    subtitle: 'Buyurtma berish usulini tanlang. Biz sizga eng yangi nonlarni yetkazib beramiz.',
    delivery: 'Yetkazib berish',
    deliverySub: 'Manzilga eltish',
    pickup:   'Olib ketish',
    pickupSub: 'Filialdan olish',
    skip:     'Keyinroq tanlash',
  },
  ru: {
    title:    'Добро пожаловать',
    subtitle: 'Выберите способ получения. Мы доставим свежий хлеб прямо к вам.',
    delivery: 'Доставка',
    deliverySub: 'Привезём по адресу',
    pickup:   'Самовывоз',
    pickupSub: 'Из нашего филиала',
    skip:     'Выбрать позже',
  },
}

export function WelcomePage() {
  const navigate = useNavigate()
  const { setDeliveryType } = useDeliveryStore()
  const { language } = useLangStore()
  const t = T[language] ?? T.uz

  const handleSelect = (type: DeliveryType) => {
    setDeliveryType(type)
    if (type === 'delivery') {
      navigate('/delivery-location', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const handleSkip = () => {
    setDeliveryType('delivery')
    navigate('/', { replace: true })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#f1f8f8', // Light cyan background matching screenshot
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Top Header */}
      <header style={{
        padding: '20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.span 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: '#1e293b',
          }}>
          Tabiiy Non
        </motion.span>
      </header>

      {/* Main White Container */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ 
          flex: 1, 
          background: '#ffffff', 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24,
          padding: '32px 20px',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.02)'
        }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          {/* Top Icon */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ rotate: 10, scale: 1.05 }}
            transition={{ type: "spring" }}
            style={{
              width: 56, height: 56,
              borderRadius: 16,
              background: '#eaf6f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
              color: '#0f172a'
            }}>
            <Croissant size={28} strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 12,
              textAlign: 'center',
            }}>
            {t.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: 14,
              color: '#64748b',
              lineHeight: 1.5,
              textAlign: 'center',
              marginBottom: 32,
              maxWidth: '280px',
            }}>
            {t.subtitle}
          </motion.p>

          {/* Option cards */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Delivery */}
            <motion.button
              variants={itemVariants}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleSelect('delivery')}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '24px 16px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 12,
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
            >
              <Bike size={32} color="#0f172a" strokeWidth={1.5} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{t.delivery}</span>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>{t.deliverySub}</span>
              </div>
            </motion.button>

            {/* Pickup */}
            <motion.button
              variants={itemVariants}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleSelect('pickup')}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '24px 16px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 12,
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
            >
              <Store size={32} color="#0f172a" strokeWidth={1.5} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{t.pickup}</span>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>{t.pickupSub}</span>
              </div>
            </motion.button>
          </div>

          {/* Skip */}
          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.9 }}
            onClick={handleSkip}
            style={{
              marginTop: 24,
              fontSize: 13,
              fontWeight: 500,
              color: '#94a3b8',
              background: 'none', border: 'none',
              cursor: 'pointer', padding: '8px 16px',
            }}
          >
            {t.skip}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
