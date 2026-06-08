import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import type { HTMLMotionProps } from 'framer-motion'
import { photoUrl } from '@/api'
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
  const imageUrl = product.image_url

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#ffffff',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
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
        <div style={{ padding: '16px' }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 6,
            color: '#0f172a',
          }}>
            {product.name}
          </h3>

          <p style={{
            fontSize: 13,
            color: '#64748b',
            lineHeight: 1.4,
            marginBottom: 16,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {product.description || 'Svejiy, issiq va mazali tandoor noni...'}
          </p>

          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: 16,
          }}>
            {price} <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{sumLabel}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onAdd(product)}
            disabled={!product.is_available || addDisabled}
            style={{
              width: '100%',
              background: product.is_available && !addDisabled ? '#e8751a' : '#cbd5e1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: product.is_available && !addDisabled ? 'pointer' : 'not-allowed',
              boxShadow: product.is_available && !addDisabled ? '0 4px 12px rgba(232, 117, 26, 0.2)' : 'none',
            }}
          >
            <ShoppingCart size={18} strokeWidth={2.5} />
            {product.is_available ? addLabel : outLabel}
          </motion.button>
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
      background: '#eefcfd',
      borderRadius: 20,
      padding: '4px 8px',
      gap: 12,
    }}>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onDec}
        disabled={disabled || value <= min}
        style={{
          width: 24, height: 24,
          background: 'transparent',
          color: disabled || value <= min ? '#94a3b8' : '#0f172a',
          fontSize: 16, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: !disabled && value > min ? 'pointer' : 'not-allowed',
        }}
      >
        −
      </motion.button>
      <span style={{ 
        minWidth: 16, textAlign: 'center', 
        fontWeight: 600, fontSize: 14, color: '#0f172a' 
      }}>
        {value}
      </span>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onInc}
        disabled={disabled}
        style={{
          width: 24, height: 24,
          background: 'transparent',
          color: disabled ? '#94a3b8' : '#0f172a',
          fontSize: 16, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        +
      </motion.button>
    </div>
  )
}
