import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../shared/lib/firebase'

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#141414', border: '1px solid #2e2e2e',
  borderRadius: 10, color: '#f0ece4', fontSize: 14,
  boxSizing: 'border-box', outline: 'none',
}

export function SettingsPage() {
  const [workStart, setWorkStart] = useState(8)
  const [workEnd, setWorkEnd] = useState(22)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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
      <h2 style={{ color: '#f0ece4', fontWeight: 800, fontSize: 18, marginBottom: 24 }}>⚙️ Настройки</h2>

      {/* Working hours */}
      <div style={{ background: '#141414', border: '1px solid #242424', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <p style={{ color: '#c8a96e', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>🕐 Рабочие часы (Ташкент UTC+5)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Открытие</p>
            <input type="number" min={0} max={23} value={workStart}
              onChange={e => setWorkStart(Number(e.target.value))}
              style={inp}
            />
            <p style={{ color: '#4b5563', fontSize: 11, marginTop: 4 }}>{workStart}:00</p>
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Закрытие</p>
            <input type="number" min={0} max={24} value={workEnd}
              onChange={e => setWorkEnd(Number(e.target.value))}
              style={inp}
            />
            <p style={{ color: '#4b5563', fontSize: 11, marginTop: 4 }}>{workEnd}:00</p>
          </div>
        </div>
        <button onClick={save} disabled={saving} style={{
          padding: '11px 24px', background: saving ? '#6b5a3e' : '#c8a96e',
          border: 'none', borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer',
        }}>
          {saved ? '✓ Сохранено' : saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      {/* Stock reset info */}
      <div style={{ background: '#141414', border: '1px solid #242424', borderRadius: 14, padding: '20px 22px' }}>
        <p style={{ color: '#c8a96e', fontWeight: 800, fontSize: 15, marginBottom: 8 }}>📦 Авто-сброс остатков</p>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          Каждый день при открытии админки остатки всех товаров обнуляются до <code style={{ color: '#f0ece4' }}>default_quantity</code>.
          Задайте <b style={{ color: '#f0ece4' }}>«Остаток по умолч.»</b> в карточке товара.
        </p>
        {lastReset && (
          <p style={{ color: '#4b5563', fontSize: 12, marginBottom: 12 }}>
            Последний сброс: <span style={{ color: '#9ca3af' }}>{lastReset}</span>
          </p>
        )}
        <button onClick={forceReset} style={{
          padding: '8px 18px', background: '#1f1f1f', border: '1px solid #2e2e2e',
          borderRadius: 8, color: '#9ca3af', fontSize: 13, cursor: 'pointer',
        }}>
          🔄 Принудительно сбросить отметку
        </button>
      </div>
    </div>
  )
}
