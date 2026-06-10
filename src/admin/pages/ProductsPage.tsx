import { useEffect, useState } from 'react'
import { productsApi } from '../api/index'
import type { Product } from '../types/index'

const DESC_TABIIY_UZ = `🍞 Tabiiy non

🌾 Tarkibi: Bug'doy uni, suv, tuz va xamirturish
⚖️ Vazni: 550 gr
💵 Narxi: 7 000 so'm

✨ Foydali va shifobaxsh xususiyatlari:

Oson hazm bo'ladi: Tabiiy xamirturish sababli oshqozonda og'irlik va dam bo'lishini keltirib chiqarmaydi.

Ichaklar uchun foydali: Ichak mikroflorasini yaxshilaydi va hazm tizimini tartibga soladi.

Qon shakarini me'yorda ushlaydi: Glyukozaning keskin ko'tarilishini oldini oladi va uzoq vaqt to'qlik hissini beradi.

Minerallarga boy: Don tarkibidagi foydali elementlar va temirning organizmga oson so'rilishiga yordam beradi.

100% ziyonsiz: Tarkibida sun'iy kimyoviy qo'shimchalar, drojji va konservantlar yo'q.

Sog'lom ovqatlanish va oshqozon-ichak tizimini asrash uchun eng yaxshi tanlov!`

const DESC_TABIIY_RU = `🍞 Табиий Нон

🌾 Состав: Пшеничная мука, вода, соль и закваска
⚖️ Вес: 550 гр
💵 Цена: 7 000 сум

✨ Полезные и целебные свойства:

Легко усваивается: Натуральная закваска не вызывает тяжести в желудке и вздутия.

Полезен для кишечника: Улучшает микрофлору кишечника и нормализует пищеварение.

Стабилизирует сахар в крови: Предотвращает резкий подъём глюкозы и надолго даёт чувство сытости.

Богат минералами: Помогает лёгкому усвоению полезных элементов и железа из зерна.

100% натуральный: Без искусственных химических добавок, дрожжей и консервантов.

Лучший выбор для здорового питания и защиты желудочно-кишечного тракта!`

const DESC_MIKS_UZ = `🍞 Miks non

🌾 Tarkibi: Arpa uni, bug'doy uni, makkajo'xori uni, sabzi soki, tuz va xamirturish
⚖️ Vazni: 600 gr
💵 Narxi: 10 000 so'm

✨ Foydali va shifobaxsh xususiyatlari:

Uch karra kuchli vitaminlar: Arpa, bug'doy va makkajo'xori unining aralashmasi organizmni barcha zarur minerallar va kletchatka bilan ta'minlaydi.

Ko'z va teri uchun foydali: Tarkibidagi tabiiy sabzi soki vitamin A ga boy bo'lib, ko'rish qobiliyatini va immun tizimini mustahkamlaydi.

Modda almashinuvini yaxshilaydi: Arpa va makkajo'xori uni ovqat hazm qilishni tezlashtiradi, qon tomirlarini tozalashga yordam beradi.

Uzoq vaqt to'q tutadi: Murakkab uglevodlarga boy bo'lgani uchun energiyani uzoq vaqt ushlab turadi va ortiqcha vazndan qochishga yordam beradi.

100% tabiiy va toza: Sun'iy kimyoviy qo'shimchalarsiz, faqat tabiiy mahsulotlardan tayyorlangan.

Sog'lik va energiya manbai bo'lgan haqiqiy vitaminlar miksi!`

const DESC_MIKS_RU = `🍞 Микс Нон

🌾 Состав: Ячменная мука, пшеничная мука, кукурузная мука, морковный сок, соль и закваска
⚖️ Вес: 600 гр
💵 Цена: 10 000 сум

✨ Полезные и целебные свойства:

Тройная сила витаминов: Смесь ячменной, пшеничной и кукурузной муки обеспечивает организм всеми необходимыми минералами и клетчаткой.

Полезен для глаз и кожи: Натуральный морковный сок богат витамином A, укрепляет зрение и иммунную систему.

Улучшает обмен веществ: Ячменная и кукурузная мука ускоряет пищеварение, помогает очищению сосудов.

Надолго даёт сытость: Богат сложными углеводами, которые долго удерживают энергию и помогают избежать лишнего веса.

100% натуральный и чистый: Без искусственных химических добавок, только из натуральных продуктов.

Настоящий витаминный микс — источник здоровья и энергии!`

const BREAD_PRESETS = [
  {
    name_uz: "Tabiiy Non",
    name_ru: "Табиий Нон",
    image_url: "/images/tabiiy-non.jpg",
    description_uz: DESC_TABIIY_UZ,
    description_ru: DESC_TABIIY_RU,
  },
  {
    name_uz: "Miks Non",
    name_ru: "Микс Нон",
    image_url: "/images/miks-non.jpg",
    description_uz: DESC_MIKS_UZ,
    description_ru: DESC_MIKS_RU,
  },
]

const PRODUCTS_SEED = [
  {
    name_uz: "Tabiiy Non",
    name_ru: "Табиий Нон",
    price: 7000,
    quantity: 100,
    is_available: true,
    is_visible: true,
    sort_order: 1,
    image_url: "/images/tabiiy-non.jpg",
    photo_file_id: null,
    description_uz: DESC_TABIIY_UZ,
    description_ru: DESC_TABIIY_RU,
  },
  {
    name_uz: "Miks Non",
    name_ru: "Микс Нон",
    price: 10000,
    quantity: 100,
    is_available: true,
    is_visible: true,
    sort_order: 2,
    image_url: "/images/miks-non.jpg",
    photo_file_id: null,
    description_uz: DESC_MIKS_UZ,
    description_ru: DESC_MIKS_RU,
  },
]

const empty = { name_uz: '', name_ru: '', price: 0, quantity: 0, is_visible: true, sort_order: 0, image_url: null }

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
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
        await productsApi.update(editing.id!, {
          ...editing,
          description_uz: descriptionUz || (editing as any).description_uz,
          description_ru: descriptionRu || (editing as any).description_ru,
        })
      }
      await load()
      setEditing(null)
      if (isNew) {
        resetForm()
        setIsNew(false)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  const del = async (id: number | string) => {
    await productsApi.delete(id)
    await load()
  }

  const toggle = async (p: Product) => {
    await productsApi.update(p.id, { is_visible: !p.is_visible })
    await load()
  }

  const seedProducts = async () => {
    if (!confirm('Удалить все товары и заполнить заново (Tabiiy Non + Miks Non)?')) return
    setSeedLoading(true)
    try {
      const existing = await productsApi.list()
      for (const p of existing) {
        await productsApi.delete(p.id)
      }
      for (const p of PRODUCTS_SEED) {
        await productsApi.create(p)
      }
      await load()
    } catch (e: any) {
      alert('Ошибка: ' + (e?.message ?? e))
    } finally {
      setSeedLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => { resetForm(); setEditing(empty); setIsNew(true) }}
          style={{ padding: '8px 18px', background: '#c8a96e', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
          + Добавить товар
        </button>
        <button onClick={seedProducts} disabled={seedLoading}
          style={{ padding: '8px 18px', background: '#ef4444', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: seedLoading ? 'not-allowed' : 'pointer', opacity: seedLoading ? 0.6 : 1 }}>
          {seedLoading ? 'Обновляется...' : '🔄 Сбросить товары'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: 18 }}>
            {(p as any).image_url && (
              <img src={(p as any).image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
            )}
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
              <button onClick={() => {
                setEditing({ ...p })
                setDescriptionUz((p as any).description_uz || '')
                setDescriptionRu((p as any).description_ru || '')
                setPreviewImage((p as any).image_url || null)
                setIsNew(false)
              }} style={actBtn('#3b82f6')}>Изменить</button>
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
              onClick={() => { setEditing(null); setIsNew(false); resetForm() }}
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}
            >✕</button>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: '#666', fontSize: 12, marginBottom: 8 }}>Название</label>
            <input
              value={nameSearch}
              onChange={e => { setNameSearch(e.target.value); setShowPresetSuggestions(true) }}
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
                      setEditing({ ...editing, name_ru: preset.name_ru, name_uz: preset.name_uz, image_url: preset.image_url })
                      setDescriptionRu(preset.description_ru)
                      setDescriptionUz(preset.description_uz)
                      setPreviewImage(preset.image_url)
                      setShowPresetSuggestions(false)
                    }}
                    style={{ display: 'flex', gap: 12, padding: 10, cursor: 'pointer', alignItems: 'center', color: '#fff' }}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <img src={preset.image_url} alt={preset.name_ru} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
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
            <input value={(editing as any).name_uz || ''} onChange={e => setEditing({ ...editing, name_uz: e.target.value })} style={inputSt} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Название (RU)</label>
            <input value={(editing as any).name_ru || ''} onChange={e => setEditing({ ...editing, name_ru: e.target.value })} style={inputSt} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Цена (сум)</label>
            <input type="number" value={((editing as any).price ?? 0) === 0 ? '' : (editing as any).price} placeholder="0"
              onChange={e => setEditing({ ...editing, price: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={e => e.target.select()} style={inputSt} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Количество</label>
            <input type="number" value={((editing as any).quantity ?? 0) === 0 ? '' : (editing as any).quantity} placeholder="0"
              onChange={e => setEditing({ ...editing, quantity: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={e => e.target.select()} style={inputSt} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>URL картинки</label>
            <input value={(editing as any).image_url || ''} onChange={e => { setEditing({ ...editing, image_url: e.target.value }); setPreviewImage(e.target.value || null) }} style={inputSt} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Telegram File ID (необязательно)</label>
            <input value={(editing as any).photo_file_id || ''} onChange={e => setEditing({ ...editing, photo_file_id: e.target.value })} style={inputSt} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Описание (UZ)</label>
            <textarea value={descriptionUz} onChange={e => setDescriptionUz(e.target.value)} style={{ ...inputSt, minHeight: 160, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 4 }}>Описание (RU)</label>
            <textarea value={descriptionRu} onChange={e => setDescriptionRu(e.target.value)} style={{ ...inputSt, minHeight: 160, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={save} disabled={loading}
              style={{ flex: 1, padding: 12, background: '#c8a96e', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button onClick={() => { setEditing(null); setIsNew(false); resetForm() }}
              style={{ padding: '12px 16px', background: '#2a2a2a', border: 'none', borderRadius: 8, color: '#aaa', cursor: 'pointer' }}>
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
