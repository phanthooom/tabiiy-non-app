import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, X } from 'lucide-react'
import type { HTMLMotionProps } from 'framer-motion'
import { photoUrl } from '@/app/api'
import type { Product } from '@/shared/types'

// ── Description Renderer ─────────────────────────────────────────────────

function DescriptionRenderer({ text }: { text: string }) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []

  lines.forEach((raw, i) => {
    const line = raw.trim()

    if (!line) {
      nodes.push(<div key={i} style={{ height: 4 }} />)
      return
    }

    // 🍞 product name header — skip, already shown as title
    if (line.startsWith('🍞')) return

    // Info pills: emoji lines like 🌾 / ⚖️ / 💵
    const INFO: [string, string, string][] = [
      ['🌾', '#f0fdf4', '#15803d'],
      ['⚖️', '#eff6ff', '#1e40af'],
      ['💵', '#fff7ed', '#c2410c'],
    ]
    const pill = INFO.find(([e]) => line.startsWith(e))
    if (pill) {
      const sp = line.indexOf(' ')
      const emoji = sp > 0 ? line.slice(0, sp) : line
      const rest  = sp > 0 ? line.slice(sp + 1) : ''
      const [, bg, color] = pill
      nodes.push(
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: bg, borderRadius: 10, padding: '7px 11px',
        }}>
          <span style={{ fontSize: 15 }}>{emoji}</span>
          <span style={{ fontSize: 13, color, fontWeight: 500, lineHeight: 1.5 }}>{rest}</span>
        </div>
      )
      return
    }

    // ✨ section heading
    if (line.startsWith('✨')) {
      const label = line.replace('✨', '').replace(/:$/, '').trim()
      nodes.push(
        <p key={i} style={{
          fontSize: 11, fontWeight: 700, color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginTop: 6, marginBottom: 2,
        }}>
          ✨ {label}
        </p>
      )
      return
    }

    // Benefit line: "Title: body text"
    const colon = line.indexOf(': ')
    if (colon > 0 && colon < 36) {
      const title = line.slice(0, colon)
      const body  = line.slice(colon + 2)
      nodes.push(
        <div key={i} style={{
          borderLeft: '3px solid #e8751a', paddingLeft: 10, marginBottom: 2,
        }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{title}: </span>
          <span style={{ color: '#475569', fontSize: 13, lineHeight: 1.65 }}>{body}</span>
        </div>
      )
      return
    }

    // Default
    nodes.push(
      <p key={i} style={{ fontSize: 13, color: '#475569', lineHeight: 1.65 }}>{line}</p>
    )
  })

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{nodes}</div>
}

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

// ── Product Card ──────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  onAdd?: (product: Product) => void
  onRemove?: (product: Product) => void
  onSetQty: (product: Product, qty: number) => void
  onQtyChange?: (product: Product, qty: number) => void
  cartQty: number
  addLabel: string
  outLabel: string
  sumLabel: string
  addDisabled?: boolean
  language?: string
}

export function ProductCard({ product, onSetQty, onQtyChange, cartQty, addLabel, outLabel, sumLabel, addDisabled, language = 'ru' }: ProductCardProps) {
  const [showSheet, setShowSheet] = useState(false)
  // Single shared qty — used by BOTH card and sheet (no sync issues)
  const [localQty, setLocalQty] = useState(cartQty)
  // Ref always holds true current value (stale-closure safe for rapid taps)
  const qtyRef = useRef(cartQty)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const price = product.price.toLocaleString('ru-RU')
  const lang = language === 'uz'
  const available = product.is_available && !addDisabled

  // When server confirms, sync ref + state
  useEffect(() => {
    qtyRef.current = cartQty
    setLocalQty(cartQty)
  }, [cartQty])

  // Lock body scroll when sheet open
  useEffect(() => {
    if (!showSheet) return
    const saved = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${saved}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, saved)
    }
  }, [showSheet])

  // Unified handlers — ref-based so rapid taps never see stale value
  const scheduleSync = (qty: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { onSetQty(product, qty) }, 400)
  }

  const inc = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (qtyRef.current >= product.quantity) return
    qtyRef.current += 1
    setLocalQty(qtyRef.current)
    onQtyChange?.(product, qtyRef.current)
    scheduleSync(qtyRef.current)
  }

  const dec = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (qtyRef.current <= 0) return
    qtyRef.current -= 1
    setLocalQty(qtyRef.current)
    onQtyChange?.(product, qtyRef.current)
    scheduleSync(qtyRef.current)
  }

  const firstAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!available) return
    qtyRef.current = 1
    setLocalQty(1)
    onQtyChange?.(product, 1)
    scheduleSync(1)
  }

  const imgNode = product.image_url ? (
    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center bottom' }} />
  ) : product.photo_file_id ? (
    <ProductPhoto fileId={product.photo_file_id} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center bottom' }} fallback={<span style={{ fontSize: 56 }}>🍞</span>} />
  ) : (
    <span style={{ fontSize: 56 }}>🍞</span>
  )

  return (
    <>
      {/* ── Card ── */}
      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: '1px solid #e8edf2', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        {/* Image */}
        <div
          onClick={() => setShowSheet(true)}
          style={{
            height: 190, background: '#f8fafb', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}
        >
          {imgNode}
          {localQty > 0 && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: '#e8751a', color: '#fff',
              borderRadius: 20, padding: '3px 10px',
              fontSize: 12, fontWeight: 700,
            }}>
              {localQty}
            </div>
          )}
        </div>

        {/* Name + price + action */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {product.name}
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {price} <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>{sumLabel}</span>
            </p>
          </div>

          {localQty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={firstAdd}
              disabled={!available}
              style={{
                flexShrink: 0, border: 'none', borderRadius: 12, padding: '10px 14px',
                background: available ? '#e8751a' : '#cbd5e1',
                color: '#fff', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-body)', cursor: available ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: available ? '0 3px 10px rgba(232,117,26,0.3)' : 'none',
              }}
            >
              <ShoppingCart size={15} strokeWidth={2.5} />
              {product.is_available ? addLabel : outLabel}
            </motion.button>
          ) : (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* − gray square */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={dec}
                style={{
                  width: 40, height: 40, border: 'none', borderRadius: 11,
                  background: '#f1f5f9', fontSize: 22, fontWeight: 400,
                  color: '#0f172a', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', userSelect: 'none',
                }}
              >−</motion.button>

              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', minWidth: 22, textAlign: 'center', userSelect: 'none' }}>
                {localQty}
              </span>

              {/* + orange square */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={inc}
                disabled={addDisabled}
                style={{
                  width: 40, height: 40, border: 'none', borderRadius: 11,
                  background: '#e8751a', fontSize: 22, fontWeight: 400,
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(232,117,26,0.35)', userSelect: 'none',
                }}
              >+</motion.button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setShowSheet(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.42)' }}
            />

            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 34, stiffness: 340, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) setShowSheet(false)
              }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2001,
                background: '#fff',
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                maxHeight: '80vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 -6px 40px rgba(0,0,0,0.14)',
                touchAction: 'none',
              }}
            >
              {/* Handle row */}
              <div style={{
                flexShrink: 0, padding: '14px 16px 10px',
                display: 'flex', alignItems: 'center',
                cursor: 'grab',
              }}>
                {/* Spacer to balance the X button */}
                <div style={{ width: 32 }} />
                {/* Drag pill — centered */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: '#dde3ec' }} />
                </div>
                {/* Close button */}
                <button
                  onClick={() => setShowSheet(false)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#f1f5f9', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <X size={15} color="#64748b" strokeWidth={2.5} />
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {/* Image: padded, rounded */}
                <div style={{ padding: '0 20px 16px' }}>
                  <div style={{
                    borderRadius: 16, overflow: 'hidden',
                    height: 190, background: '#f8fafb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {imgNode}
                  </div>
                </div>

                <div style={{ padding: '0 20px 8px' }}>
                  <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 6, lineHeight: 1.3 }}>
                    {product.name}
                  </h2>
                  <p style={{ fontSize: 21, fontWeight: 800, color: '#e8751a', marginBottom: 10 }}>
                    {price} <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{sumLabel}</span>
                  </p>

                  {product.quantity > 0 && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: 8, padding: '5px 10px', marginBottom: 14,
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                        {lang ? `Mavjud: ${product.quantity}` : `В наличии: ${product.quantity}`}
                      </span>
                    </div>
                  )}

                  {(lang ? product.description_uz : product.description_ru) && (
                    <div style={{ marginBottom: 12 }}>
                      <DescriptionRenderer text={(lang ? product.description_uz : product.description_ru)!} />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom action — optimistic stepper */}
              <div style={{
                padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px))',
                borderTop: '1px solid #f1f5f9', flexShrink: 0,
              }}>
                {localQty === 0 ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { qtyRef.current = 1; setLocalQty(1); scheduleSync(1) }}
                    disabled={!available}
                    style={{
                      width: '100%', border: 'none', borderRadius: 14, padding: '15px',
                      background: available ? '#e8751a' : '#cbd5e1',
                      color: '#fff', fontSize: 16, fontWeight: 700,
                      fontFamily: 'var(--font-body)', cursor: available ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: available ? '0 4px 18px rgba(232,117,26,0.28)' : 'none',
                    }}
                  >
                    <ShoppingCart size={19} strokeWidth={2.5} />
                    {product.is_available ? addLabel : outLabel}
                  </motion.button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* − light square */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => dec()}
                      style={{
                        width: 52, height: 52, flexShrink: 0, border: 'none',
                        borderRadius: 14, background: '#f1f5f9',
                        fontSize: 26, fontWeight: 400, color: '#0f172a', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        userSelect: 'none',
                      }}
                    >−</motion.button>

                    {/* Count */}
                    <span style={{
                      fontSize: 22, fontWeight: 800, color: '#0f172a',
                      minWidth: 32, textAlign: 'center', userSelect: 'none',
                    }}>
                      {localQty}
                    </span>

                    {/* + orange square */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => inc()}
                      style={{
                        width: 52, height: 52, flexShrink: 0, border: 'none',
                        borderRadius: 14, background: '#e8751a',
                        fontSize: 26, fontWeight: 400, color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(232,117,26,0.35)',
                        userSelect: 'none',
                      }}
                    >+</motion.button>

                    {/* Корзина pill */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowSheet(false)}
                      style={{
                        flex: 1, height: 52, border: 'none', borderRadius: 14,
                        background: '#e8751a', color: '#fff', fontSize: 15, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        boxShadow: '0 2px 10px rgba(232,117,26,0.3)',
                      }}
                    >
                      <ShoppingCart size={17} strokeWidth={2.5} />
                      {lang ? 'Savat' : 'Корзина'}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
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
