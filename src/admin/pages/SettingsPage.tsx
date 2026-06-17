import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../shared/lib/firebase'
import { Clock, RotateCcw } from 'lucide-react'

export function SettingsPage() {
  const [workStart, setWorkStart] = useState(8)
  const [workEnd, setWorkEnd]     = useState(22)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [lastReset, setLastReset] = useState<string | null>(null)

  useEffect(() => {
    getDoc(doc(db, 'settings', 'main')).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setWorkStart(d.work_start_hour ?? 8)
        setWorkEnd(d.work_end_hour ?? 22)
        setLastReset(d.last_stock_reset ?? null)
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'main'), { work_start_hour: workStart, work_end_hour: workEnd }, { merge: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const forceReset = async () => {
    if (!confirm('Сбросить сегодняшнюю отметку? Остатки обновятся при следующем открытии админки.')) return
    await setDoc(doc(db, 'settings', 'main'), { last_stock_reset: '' }, { merge: true })
    setLastReset('')
    alert('Отметка сброшена. Откройте вкладку Товары — остатки обновятся.')
  }

  return (
    <div style={{ maxWidth: 540 }}>
      {/* Working hours */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={iconBox('#fef9ec')}><Clock size={18} color="#d97706" /></div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>Рабочие часы</p>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Ташкент UTC+5</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <span style={labelStyle}>Открытие</span>
            <input
              type="number" min={0} max={23} value={workStart}
              onChange={e => setWorkStart(Number(e.target.value))}
              style={inp}
            />
            <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 12 }}>{workStart}:00</p>
          </div>
          <div>
            <span style={labelStyle}>Закрытие</span>
            <input
              type="number" min={0} max={24} value={workEnd}
              onChange={e => setWorkEnd(Number(e.target.value))}
              style={inp}
            />
            <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 12 }}>{workEnd}:00</p>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '11px 24px',
            background: saved ? '#dcfce7' : '#c8a96e',
            border: 'none', borderRadius: 12,
            color: saved ? '#16a34a' : '#111827',
            fontWeight: 800, fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
        >
          {saved ? '✓ Сохранено' : saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      {/* Stock reset */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={iconBox('#f0fdf4')}><RotateCcw size={17} color="#16a34a" /></div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>Авто-сброс остатков</p>
        </div>
        <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
          Каждый день при открытии админки остатки всех товаров обнуляются до{' '}
          <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 5, color: '#111827', fontSize: 12 }}>
            default_quantity
          </code>.
          Задайте <b style={{ color: '#111827' }}>«Остаток по умолч.»</b> в карточке товара.
        </p>
        {lastReset && (
          <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 14 }}>
            Последний сброс:{' '}
            <span style={{ color: '#6b7280', fontWeight: 600 }}>{lastReset}</span>
          </p>
        )}
        <button
          onClick={forceReset}
          style={{
            padding: '9px 18px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 10, color: '#374151',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Принудительно сбросить отметку
        </button>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: '20px',
  marginBottom: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: 10, color: '#111827', fontSize: 15,
  boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit', fontWeight: 600,
}

const labelStyle: React.CSSProperties = {
  display: 'block', color: '#9ca3af', fontSize: 11,
  fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', marginBottom: 6,
}

function iconBox(bg: string): React.CSSProperties {
  return {
    width: 38, height: 38,
    background: bg,
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
  }
}
