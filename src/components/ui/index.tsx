import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, X } from 'lucide-react'
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
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost: { background: 'var(--surface-2)', color: 'var(--primary)', border: '1px solid var(--border)' },
    danger: { background: 'var(--surface)', color: 'var(--error)', border: '1px solid var(--error)' },
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
        ...styles[variant], ...sizes[size],
        width: fullWidth ? '100%' : undefined,
        fontWeight: 600, fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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
  return <div className="spinner" style={{ width: size, height: size, margin: '0 auto' }} />
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
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
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

export function ProductPhoto({ fileId, alt = '', style, fallback = <span style={{ fontSize: 28 }}>🍞</span> }: ProductPhotoProps) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [fileId])
  if (!fileId || failed) return <>{fallback}</>
  return <img src={photoUrl(fileId)} alt={alt} style={style} onError={() => setFailed(true)} />
}

// ── Product Card (2-col grid) ─────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onRemove: (product: Product) => void
  cartQty: number
  addLabel: string
  outLabel: string
  sumLabel: string
  addDisabled?: boolean
  language?: string
}

export function ProductCard({ product, onAdd, onRemove, cartQty, addLabel, outLabel, sumLabel, addDisabled, language = 'ru' }: ProductCardProps) {
  const [showSheet, setShowSheet] = useState(false)
  const price = product.price.toLocaleString('ru-RU')
  const lang = language === 'uz'
  const available = product.is_available && !addDisabled

  const imgNode = product.image_url ? (
    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  ) : product.photo_file_id ? (
    <ProductPhoto fileId={product.photo_file_id} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallback={<span style={{ fontSize: 48 }}>🍞</span>} />
  ) : (
    <span style={{ fontSize: 48 }}>🍞</span>
  )

  return (
    <>
      {/* ── Compact card ── */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e8edf2',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Image */}
        <div
          onClick={() => setShowSheet(true)}
          style={{
            height: 155, background: '#f8fafb', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', flexShrink: 0,
          }}
        >
          {imgNode}
          {cartQty > 0 && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: '#e8751a', color: '#fff',
              borderRadius: 20, padding: '2px 8px',
              fontSize: 11, fontWeight: 700,
            }}>
              {cartQty}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            margin: 0,
          }}>
            {product.name}
          </p>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {price} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>{sumLabel}</span>
          </p>

          {/* Button or stepper */}
          {cartQty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); if (available) onAdd(product) }}
              disabled={!available}
              style={{
                marginTop: 'auto',
                width: '100%', border: 'none', borderRadius: 10, padding: '9px 0',
                background: available ? '#e8751a' : '#cbd5e1',
                color: '#fff', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: available ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <ShoppingCart size={14} strokeWidth={2.5} />
              {product.is_available ? addLabel : outLabel}
            </motion.button>
          ) : (
            <div
              style={{
                marginTop: 'auto',
                display: 'flex', alignItems: 'center',
                background: '#fff6ef', border: '1.5px solid #e8751a',
                borderRadius: 10, overflow: 'hidden',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={(e) => { e.stopPropagation(); onRemove(product) }}
                style={{
                  flex: 1, height: 36, background: 'transparent', border: 'none',
                  fontSize: 20, fontWeight: 400, color: '#e8751a', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                −
              </motion.button>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e8751a', minWidth: 24, textAlign: 'center' }}>
                {cartQty}
              </span>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={(e) => { e.stopPropagation(); onAdd(product) }}
                disabled={addDisabled}
                style={{
                  flex: 1, height: 36, background: 'transparent', border: 'none',
                  fontSize: 20, fontWeight: 400, color: '#e8751a', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                +
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {showSheet && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSheet(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'flex-end',
            }}
          >
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                width: '100%',
                maxHeight: '88vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#dde3ec' }} />
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowSheet(false)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#f1f5f9', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <X size={16} color="#475569" />
              </button>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {/* Product image */}
                <div style={{
                  height: 220, background: '#f8fafb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {imgNode}
                </div>

                <div style={{ padding: '20px 20px 0' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6, lineHeight: 1.3 }}>
                    {product.name}
                  </h2>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#e8751a', marginBottom: 12 }}>
                    {price} <span style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8' }}>{sumLabel}</span>
                  </p>

                  {/* Stock */}
                  {product.quantity > 0 && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: 8, padding: '6px 12px', marginBottom: 16,
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                        {lang ? `Mavjud: ${product.quantity}` : `В наличии: ${product.quantity}`}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {product.description && (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                        {lang ? 'Tavsif' : 'Описание'}
                      </p>
                      <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
                        {product.description}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom action bar */}
              <div style={{
                padding: '14px 20px calc(14px + env(safe-area-inset-bottom, 0px))',
                borderTop: '1px solid #f1f5f9',
                flexShrink: 0,
              }}>
                {cartQty === 0 ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { onAdd(product); setShowSheet(false) }}
                    disabled={!available}
                    style={{
                      width: '100%', border: 'none', borderRadius: 14, padding: '15px',
                      background: available ? '#e8751a' : '#cbd5e1',
                      color: '#fff', fontSize: 16, fontWeight: 700,
                      fontFamily: 'var(--font-body)',
                      cursor: available ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: available ? '0 4px 20px rgba(232,117,26,0.3)' : 'none',
                    }}
                  >
                    <ShoppingCart size={20} strokeWidth={2.5} />
                    {product.is_available ? addLabel : outLabel}
                  </motion.button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      background: '#fff6ef', border: '1.5px solid #e8751a',
                      borderRadius: 14, overflow: 'hidden',
                    }}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onRemove(product)}
                        style={{
                          flex: 1, height: 50, background: 'transparent', border: 'none',
                          fontSize: 24, color: '#e8751a', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        −
                      </motion.button>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#e8751a', minWidth: 32, textAlign: 'center' }}>
                        {cartQty}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onAdd(product)}
                        disabled={addDisabled}
                        style={{
                          flex: 1, height: 50, background: 'transparent', border: 'none',
                          fontSize: 24, color: '#e8751a', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        +
                      </motion.button>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowSheet(false)}
                      style={{
                        height: 50, paddingInline: 20, border: 'none', borderRadius: 14,
                        background: '#f1f5f9', color: '#475569', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lang ? 'Tayyor' : 'Готово'}
                    </motion.button>
                  </div>
                )}
              </div>
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
      display: 'flex', alignItems: 'center',
      background: '#eefcfd', borderRadius: 20, padding: '4px 8px', gap: 12,
    }}>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onDec}
        disabled={disabled || value <= min}
        style={{
          width: 24, height: 24, background: 'transparent',
          color: disabled || value <= min ? '#94a3b8' : '#0f172a',
          fontSize: 16, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: !disabled && value > min ? 'pointer' : 'not-allowed',
        }}
      >−</motion.button>
      <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
        {value}
      </span>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onInc}
        disabled={disabled}
        style={{
          width: 24, height: 24, background: 'transparent',
          color: disabled ? '#94a3b8' : '#0f172a',
          fontSize: 16, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >+</motion.button>
    </div>
  )
}
