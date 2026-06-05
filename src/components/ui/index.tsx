import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { BASE_URL, photoUrl } from '@/api'
import type { Product } from '@/types'

// ── Button ────────────────────────────────────────────────────────────────

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'size' | 'children'> & {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children?: React.ReactNode
}

export function Button({
  children, variant = 'primary', size = 'md',
  loading, fullWidth, className, disabled, ...props
}: ButtonProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
    },
    ghost: {
      background: 'var(--surface-2)',
      color: 'var(--primary)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--surface)',
      color: 'var(--error)',
      border: '1px solid var(--error)',
    },
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 14px', fontSize: '13px', borderRadius: 'var(--radius)' },
    md: { padding: '11px 20px', fontSize: '14px', borderRadius: 'var(--radius)' },
    lg: { padding: '16px 24px', fontSize: '14px', borderRadius: 'var(--radius)' },
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      style={{
        ...styles[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : undefined,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.04em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, opacity 0.2s',
        boxShadow: variant === 'primary' ? 'var(--shadow)' : undefined,
      }}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
      {children}
    </motion.button>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────

export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size, margin: '0 auto' }}
    />
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────

export function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span style={{
      position: 'absolute', top: -5, right: -7,
      background: 'var(--accent)', color: '#fff',
      borderRadius: '50%', minWidth: 16, height: 16,
      fontSize: 10, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 3px',
    }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ── Product Photo ─────────────────────────────────────────────────────────

interface ProductPhotoProps {
  fileId?: string | null
  alt?: string
  style?: React.CSSProperties
  fallback?: React.ReactNode
}

export function ProductPhoto({
  fileId,
  alt = '',
  style,
  fallback = <span style={{ fontSize: 28 }}>🍞</span>,
}: ProductPhotoProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [fileId])

  if (!fileId || failed) {
    return <>{fallback}</>
  }

  return (
    <img
      src={photoUrl(fileId)}
      alt={alt}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}

// ── Product Card ──────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  cartQty: number
  addLabel: string
  outLabel: string
  sumLabel: string
  addDisabled?: boolean
}

export function ProductCard({ product, onAdd, cartQty, addLabel, outLabel, sumLabel, addDisabled }: ProductCardProps) {
  const price = product.price.toLocaleString('ru-RU')
  const [showInfo, setShowInfo] = useState(false)
  const imageUrl = product.image_url?.startsWith('/static/')
    ? `${BASE_URL}${product.image_url}`
    : product.image_url

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#ffffff',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.03)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        }}
      >
        {/* Photo */}
        <div style={{
          height: 200,
          background: '#f8fbfc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {product.image_url ? (
            <img
              src={imageUrl ?? undefined}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : product.photo_file_id ? (
            <ProductPhoto
              fileId={product.photo_file_id}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              fallback={<span style={{ fontSize: 64 }}>🍞</span>}
            />
          ) : (
            <span style={{ fontSize: 64 }}>🍞</span>
          )}

          {product.description != null && product.description !== '' && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowInfo(true) }}
              style={{
                position: 'absolute', top: 10, left: 10,
                background: 'rgba(4,22,39,0.6)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                borderRadius: '50%',
                width: 28, height: 28,
                border: '1px solid rgba(255,255,255,0.25)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >i</button>
          )}

          {/* Availability badge */}
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: product.is_available
              ? 'rgba(45, 157, 92, 0.9)'
              : 'rgba(4,22,39,0.6)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}>
            {product.is_available ? `${product.quantity} шт` : outLabel}
          </div>

          {cartQty > 0 && (
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}>
              В корзине: {cartQty}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '16px 20px 20px' }}>
          <h3 style={{
            fontSize: 19,
            fontWeight: 700,
            marginBottom: 6,
            lineHeight: 1.3,
            color: '#1a1a1a',
            letterSpacing: '-0.02em',
          }}>
            {product.name}
          </h3>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
          }}>
            <span style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
            }}>
              {price} <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{sumLabel}</span>
            </span>

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onAdd(product)}
              disabled={!product.is_available || addDisabled}
              style={{
                background: product.is_available && !addDisabled ? '#f07c34' : '#f1f5f9',
                color: product.is_available && !addDisabled ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: 14,
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.02em',
                cursor: product.is_available && !addDisabled ? 'pointer' : 'not-allowed',
                boxShadow: product.is_available && !addDisabled ? '0 4px 12px rgba(240, 124, 52, 0.3)' : 'none',
              }}
            >
              {product.is_available ? addLabel : outLabel}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(4,22,39,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                padding: 24,
                maxWidth: 360,
                width: '100%',
                position: 'relative',
                maxHeight: '80vh',
                overflowY: 'auto',
                border: '1px solid var(--border)',
              }}
            >
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'none', border: 'none',
                  fontSize: 18, cursor: 'pointer',
                  color: 'var(--text-3)',
                }}
              >✕</button>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 12, color: 'var(--primary)' }}>
                {product.name}
              </h3>
              <p style={{
                whiteSpace: 'pre-wrap', fontSize: 15,
                color: 'var(--text-2)', lineHeight: 1.6,
              }}>
                {product.description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Quantity Stepper ──────────────────────────────────────────────────────

interface StepperProps {
  value: number
  onInc: () => void
  onDec: () => void
  min?: number
  disabled?: boolean
}

export function Stepper({ value, onInc, onDec, min = 0, disabled = false }: StepperProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: 'var(--surface-2)',
      borderRadius: 'var(--radius-full)',
      padding: '2px',
    }}>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onDec}
        disabled={disabled || value <= min}
        style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: !disabled && value > min ? 'var(--surface)' : 'transparent',
          color: !disabled && value > min ? 'var(--primary)' : 'var(--text-3)',
          fontSize: 18, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: !disabled && value > min ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}
      >
        −
      </motion.button>
      <span style={{ minWidth: 26, textAlign: 'center', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
        {value}
      </span>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onInc}
        disabled={disabled}
        style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: disabled ? 'transparent' : 'var(--accent)',
          color: disabled ? 'var(--text-3)' : '#fff',
          fontSize: 18, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        +
      </motion.button>
    </div>
  )
}
