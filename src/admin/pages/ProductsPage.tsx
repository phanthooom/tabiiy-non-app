import { useEffect, useState } from 'react'
import { productsApi } from '../api/index'
import { BASE_URL } from '@/api'
import type { Product } from '../types/index'

const BREAD_PRESETS = [
  {
    name_uz: "Tabiiy Non",
    name_ru: "Табиий Нон",
    image_url: "/static/images/tabiiy-non.png",
    description_uz: "🌾 Tarkibi: Bug'doy uni, suv, tuz va xamirturish\n⚖️ Vazni: 550 gr\n\n✨ Foydali xususiyatlari:\n\n• Oson hazm bo'ladi: Tabiiy xamirturish sababli oshqozonda og'irlik keltirib chiqarmaydi.\n• Ichaklar uchun foydali: Ichak mikroflorasini yaxshilaydi.\n• Qon shakarini me'yorda ushlaydi: Glyukozaning keskin ko'tarilishini oldini oladi.\n• Minerallarga boy: Temir va foydali elementlarning oson so'rilishiga yordam beradi.\n• 100% ziyonsiz: Sun'iy qo'shimchalar, drojji va konservantlar yo'q.",
    description_ru: "🌾 Состав: Пшеничная мука, вода, соль и закваска\n⚖️ Вес: 550 гр\n\n✨ Полезные свойства:\n\n• Легко усваивается: Натуральная закваска не вызывает тяжести в желудке.\n• Полезен для кишечника: Улучшает микрофлору кишечника.\n• Стабилизирует сахар в крови: Предотвращает резкий подъём глюкозы.\n• Богат минералами: Помогает лёгкому усвоению железа и полезных элементов.\n• 100% натуральный: Без искусственных добавок, дрожжей и консервантов.",
  },
  {
    name_uz: "Miks Non",
    name_ru: "Микс Нон",
    image_url: "/static/images/miks-non.png",
    description_uz: "🌾 Tarkibi: Arpa uni, bug'doy uni, makkajo'xori uni, sabzi soki, tuz va xamirturish\n⚖️ Vazni: 600 gr\n\n✨ Foydali xususiyatlari:\n\n• Uch karra kuchli vitaminlar: Uch turdagi un organizmni minerallar va kletchatka bilan ta'minlaydi.\n• Ko'z va teri uchun foydali: Sabzi soki vitamin A ga boy, ko'rish va immunitetni mustahkamlaydi.\n• Modda almashinuvini yaxshilaydi: Ovqat hazm qilishni tezlashtiradi, qon tomirlarini tozalaydi.\n• Uzoq vaqt to'q tutadi: Murakkab uglevodlar energiyani uzoq ushlab turadi.\n• 100% tabiiy: Faqat tabiiy mahsulotlardan tayyorlangan.",
    description_ru: "🌾 Состав: Ячменная мука, пшеничная мука, кукурузная мука, морковный сок, соль и закваска\n⚖️ Вес: 600 гр\n\n✨ Полезные свойства:\n\n• Тройная сила витаминов: Смесь трёх видов муки обеспечивает организм минералами и клетчаткой.\n• Полезен для глаз и кожи: Натуральный морковный сок богат витамином A, укрепляет зрение и иммунитет.\n• Улучшает обмен веществ: Ускоряет пищеварение, помогает очищению сосудов.\n• Надолго даёт сытость: Сложные углеводы долго удерживают энергию.\n• 100% натуральный: Только из натуральных продуктов, без химических добавок.",
  },
]

const empty = { name_uz: '', name_ru: '', price: 0, quantity: 0, is_visible: true, sort_order: 0, image_url: null }

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameSearch, setNameSearch] = useState('')
  const [descriptionUz, setDescriptionUz] = useState('')
  const [descriptionRu, setDescriptionRu] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showPresetSuggestions, setShowPresetSuggestions] = useState(false)

  const load = async () => {
    const res = await productsApi.list()
    setProducts(res)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setNameSearch('')
    setDescriptionUz('')
    setDescriptionRu('')
    setPreviewImage(null)
    setShowPresetSuggestions(false)
    setError('')
  }

  const save = async () => {
    if (!editing) return
    setLoading(true)
    setError('')
    try {
      if (isNew) {
        await productsApi.create({
          ...editing,
          image_url: editing.image_url ?? null,
          description_uz: descriptionUz || undefined,
          description_ru: descriptionRu || undefined,
        })
      } else {
        await productsApi.update(editing.id!, editing)
      }
      await load()
      setEditing(null)
      if (isNew) {
        resetForm()
        setIsNew(false)
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? JSON.stringify(e?.response?.data) ?? 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  const del = async (id: number) => {
    await productsApi.delete(id)
    await load()
  }

  const toggle = async (p: Product) => {
    await productsApi.update(p.id, { is_visible: !p.is_visible })
    await load()
  }

  return (
    <div>
      <button onClick={() => { resetForm(); setEditing(empty); setIsNew(true) }}
        style={{ marginBottom: 20, padding: '8px 18px', background: '#c8a96e', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
        + Добавить товар
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#f5f0e8', fontWeight: 600, marginBottom: 4 }}>{p.name_ru}</p>
                <p style={{ color: '#888', fontSize: 13 }}>{p.name_uz}</p>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12,
                background: p.is_visible ? '#22c55e22' : '#ef444422',
                color: p.is_visible ? '#22c55e' : '#ef4444',
              }}>
                {p.is_visible ? 'Виден' : 'Скрыт'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, color: '#aaa', fontSize: 14 }}>
              <span>💰 {p.price.toLocaleString()} сум</span>
              <span>📦 {p.quantity} шт</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => { setEditing({ ...p }); setIsNew(false) }} style={actBtn('#3b82f6')}>Изменить</button>
              <button onClick={() => toggle(p)} style={actBtn('#f59e0b')}>{p.is_visible ? 'Скрыть' : 'Показать'}</button>
              <button onClick={() => del(p.id)} style={actBtn('#ef4444')}>Удалить</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--surface)', overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>{isNew ? 'Добавить товар' : 'Изменить товар'}</h2>
            <button
              onClick={() => {
                setEditing(null)
                setIsNew(false)
                resetForm()
              }}
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}
            >✕</button>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: '#666', fontSize: 12, marginBottom: 8 }}>Название</label>
            <input
              value={nameSearch}
              onChange={e => {
                setNameSearch(e.target.value)
                setShowPresetSuggestions(true)
              }}
              style={inputSt}
            />
            {nameSearch.length > 0 && showPresetSuggestions && (
              <div style={{ border: '1px solid #333', borderRadius: 8, overflow: 'hidden', marginTop: 8, background: '#111' }}>
                {BREAD_PRESETS.filter(preset =>
                  preset.name_ru.toLowerCase().includes(nameSearch.toLowerCase()) ||
                  preset.name_uz.toLowerCase().includes(nameSearch.toLowerCase())
                ).map(preset => (
                  <div
                    key={preset.name_ru}
                    onClick={() => {
                      setNameSearch(preset.name_ru)
                      setEditing({
                        ...editing,
                        name_ru: preset.name_ru,
                        name_uz: preset.name_uz,
                        image_url: preset.image_url,
                      })
                      setDescriptionRu(preset.description_ru)
                      setDescriptionUz(preset.description_uz)
                      setPreviewImage(`${BASE_URL}${preset.image_url}`)
                      setShowPresetSuggestions(false)
                    }}
                    style={{ display: 'flex', gap: 12, padding: 10, cursor: 'pointer', alignItems: 'center', color: '#fff' }}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <img src={`${BASE_URL}${preset.image_url}`} alt={preset.name_ru} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                    <span>{preset.name_ru} / {preset.name_uz}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {previewImage && (
            <img src={previewImage} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Название (UZ)</label>
            <input
              value={(editing as any).name_uz || ''}
              onChange={e => setEditing({ ...editing, name_uz: e.target.value })}
              style={inputSt}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Название (RU)</label>
            <input
              value={(editing as any).name_ru || ''}
              onChange={e => setEditing({ ...editing, name_ru: e.target.value })}
              style={inputSt}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Цена (сум)</label>
            <input
              type="number"
              value={((editing as any).price ?? 0) === 0 ? '' : (editing as any).price}
              placeholder="0"
              onChange={e => setEditing({ ...editing, price: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={e => e.target.select()}
              style={inputSt}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Количество</label>
            <input
              type="number"
              value={((editing as any).quantity ?? 0) === 0 ? '' : (editing as any).quantity}
              placeholder="0"
              onChange={e => setEditing({ ...editing, quantity: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={e => e.target.select()}
              style={inputSt}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Telegram File ID (необязательно)</label>
            <input
              value={(editing as any).photo_file_id || ''}
              onChange={e => setEditing({ ...editing, photo_file_id: e.target.value })}
              style={inputSt}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Описание (UZ)</label>
            <textarea
              value={descriptionUz}
              onChange={e => setDescriptionUz(e.target.value)}
              style={{ ...inputSt, minHeight: 96, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Описание (RU)</label>
            <textarea
              value={descriptionRu}
              onChange={e => setDescriptionRu(e.target.value)}
              style={{ ...inputSt, minHeight: 96, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={save}
              disabled={loading}
              style={{ flex: 1, padding: 12, background: '#c8a96e', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={() => {
                setEditing(null)
                setIsNew(false)
                resetForm()
              }}
              style={{ padding: '12px 16px', background: '#2a2a2a', border: 'none', borderRadius: 8, color: '#aaa', cursor: 'pointer' }}
            >
              Отмена
            </button>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 16 }}>{error}</p>}
        </div>
      )}
    </div>
  )
}

const actBtn = (color: string): React.CSSProperties => ({
  padding: '5px 12px', background: color + '22', border: 'none',
  borderRadius: 6, color, fontSize: 12, cursor: 'pointer',
})

const inputSt: React.CSSProperties = {
  width: '100%', padding: '8px 12px', background: '#111',
  border: '1px solid #333', borderRadius: 8, color: '#fff',
  fontSize: 14, boxSizing: 'border-box',
}
