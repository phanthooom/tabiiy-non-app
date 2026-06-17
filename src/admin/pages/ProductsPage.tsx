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
  { name_uz: 'Tabiiy Non', name_ru: 'Табиий Нон', image_url: '/images/tabiiy-non.jpg', description_uz: DESC_TABIIY_UZ, description_ru: DESC_TABIIY_RU },
  { name_uz: 'Miks Non',   name_ru: 'Микс Нон',   image_url: '/images/miks-non.jpg',   description_uz: DESC_MIKS_UZ,   description_ru: DESC_MIKS_RU },
]

const PRODUCTS_SEED = [
  { name_uz: 'Tabiiy Non', name_ru: 'Табиий Нон', price: 7000,  quantity: 100, is_available: true, is_visible: true, sort_order: 1, image_url: '/images/tabiiy-non.jpg', photo_file_id: null, description_uz: DESC_TABIIY_UZ, description_ru: DESC_TABIIY_RU },
  { name_uz: 'Miks Non',   name_ru: 'Микс Нон',   price: 10000, quantity: 100, is_available: true, is_visible: true, sort_order: 2, image_url: '/images/miks-non.jpg',   photo_file_id: null, description_uz: DESC_MIKS_UZ,   description_ru: DESC_MIKS_RU },
]

const empty = { name_uz: '', name_ru: '', price: 0, quantity: 0, is_visible: true, sort_order: 0, image_url: null }

// ── Styles ────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#141414', border: '1px solid #2e2e2e',
  borderRadius: 10, color: '#f0ece4', fontSize: 14,
  boxSizing: 'border-box', outline: 'none', transition: 'border-color .15s',
}

const label: React.CSSProperties = {
  display: 'block', color: '#6b7280', fontSize: 11,
  fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', marginBottom: 6,
}

const section: React.CSSProperties = {
  background: '#141414', border: '1px solid #242424',
  borderRadius: 12, padding: '16px 18px', marginBottom: 12,
}

// ── Component ──────────────────────────────────────────────────────────────

export function ProductsPage() {
  const [products, setProducts]               = useState<Product[]>([])
  const [editing, setEditing]                 = useState<Partial<Product> | null>(null)
  const [isNew, setIsNew]                     = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [seedLoading, setSeedLoading]         = useState(false)
  const [error, setError]                     = useState('')
  const [nameSearch, setNameSearch]           = useState('')
  const [descriptionUz, setDescriptionUz]     = useState('')
  const [descriptionRu, setDescriptionRu]     = useState('')
  const [previewImage, setPreviewImage]       = useState<string | null>(null)
  const [showPresets, setShowPresets]         = useState(false)
  const [stockMap, setStockMap]               = useState<Record<string, number>>({})
  const [stockSaving, setStockSaving]         = useState<Record<string, boolean>>({})
  const [descTab, setDescTab]                 = useState<'ru' | 'uz'>('ru')

  const load = async () => {
    const res = await productsApi.list()
    setProducts(res)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const map: Record<string, number> = {}
    products.forEach(p => { map[String(p.id)] = (p as any).quantity ?? 0 })
    setStockMap(map)
  }, [products])

  const saveStock = async (p: Product, qty: number) => {
    const id = String(p.id)
    setStockSaving(s => ({ ...s, [id]: true }))
    try {
      await productsApi.update(p.id, { quantity: qty } as any)
      setProducts(prev => prev.map(x => String(x.id) === id ? { ...x, quantity: qty } as any : x))
    } finally {
      setStockSaving(s => ({ ...s, [id]: false }))
    }
  }

  const resetForm = () => {
    setNameSearch(''); setDescriptionUz(''); setDescriptionRu('')
    setPreviewImage(null); setShowPresets(false); setError('')
  }

  const save = async () => {
    if (!editing) return
    setLoading(true); setError('')
    try {
      if (isNew) {
        await productsApi.create({ ...editing, image_url: editing.image_url ?? null, description_uz: descriptionUz || undefined, description_ru: descriptionRu || undefined })
      } else {
        await productsApi.update(editing.id!, { ...editing, description_uz: descriptionUz || (editing as any).description_uz, description_ru: descriptionRu || (editing as any).description_ru })
      }
      await load()
      setEditing(null)
      if (isNew) { resetForm(); setIsNew(false) }
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  const del = async (id: number | string) => {
    if (!confirm('Удалить товар?')) return
    await productsApi.delete(id)
    await load()
  }

  const toggle = async (p: Product) => {
    await productsApi.update(p.id, { is_visible: !p.is_visible })
    await load()
  }

  const seedProducts = async () => {
    if (!confirm('Удалить все товары и заполнить заново?')) return
    setSeedLoading(true)
    try {
      const existing = await productsApi.list()
      for (const p of existing) await productsApi.delete(p.id)
      for (const p of PRODUCTS_SEED) await productsApi.create(p)
      await load()
    } catch (e: any) {
      alert('Ошибка: ' + (e?.message ?? e))
    } finally {
      setSeedLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Stock panel ── */}
      <div style={{ background: '#111', border: '1px solid #1e2a1e', borderRadius: 14, padding: '20px 22px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 20 }}>📦</span>
          <h3 style={{ margin: 0, color: '#c8a96e', fontWeight: 800, fontSize: 17 }}>Запас на сегодня</h3>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#4b5563' }}>обновляется мгновенно</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => {
            const id  = String(p.id)
            const qty = stockMap[id] ?? 0
            const saving = stockSaving[id]
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#1a1a1a', borderRadius: 12, padding: '12px 16px',
                border: `1px solid ${qty > 0 ? '#1a3a1a' : '#3a1a1a'}`,
                transition: 'border-color .2s',
              }}>
                {(p as any).image_url && (
                  <img src={(p as any).image_url} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: '#f0ece4', fontWeight: 700, fontSize: 15 }}>{(p as any).name_ru}</p>
                  <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 12 }}>{(p as any).name_uz}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => { const n = Math.max(0, qty - 1); setStockMap(m => ({ ...m, [id]: n })); saveStock(p, n) }}
                    style={{ width: 38, height: 38, background: '#242424', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                  >−</button>
                  <input
                    type="number" min={0} value={qty}
                    onChange={e => setStockMap(m => ({ ...m, [id]: Math.max(0, Number(e.target.value)) }))}
                    onBlur={e => saveStock(p, Math.max(0, Number(e.target.value)))}
                    style={{ width: 68, textAlign: 'center', background: '#0d0d0d', border: '1px solid #333', borderRadius: 10, color: '#f0ece4', padding: '8px 4px', fontSize: 18, fontWeight: 800, outline: 'none' }}
                  />
                  <button
                    onClick={() => { const n = qty + 1; setStockMap(m => ({ ...m, [id]: n })); saveStock(p, n) }}
                    style={{ width: 38, height: 38, background: '#c8a96e', border: 'none', borderRadius: 10, color: '#000', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                  >+</button>
                </div>
                <div style={{ minWidth: 72, textAlign: 'center' }}>
                  {saving
                    ? <span style={{ color: '#6b7280', fontSize: 13 }}>сохр...</span>
                    : <span style={{
                        display: 'inline-block', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: qty > 0 ? '#14532d' : '#450a0a',
                        color: qty > 0 ? '#4ade80' : '#f87171',
                      }}>
                        {qty > 0 ? `${qty} шт` : 'Нет'}
                      </span>
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Header actions ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <h2 style={{ margin: 0, flex: 1, color: '#f0ece4', fontWeight: 800, fontSize: 18 }}>Товары</h2>
        <button onClick={() => { resetForm(); setEditing(empty); setIsNew(true) }}
          style={{ padding: '9px 20px', background: '#c8a96e', border: 'none', borderRadius: 10, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          + Добавить
        </button>
        <button onClick={seedProducts} disabled={seedLoading}
          style={{ padding: '9px 16px', background: '#1f1f1f', border: '1px solid #2e2e2e', borderRadius: 10, color: '#9ca3af', fontWeight: 600, fontSize: 13, cursor: seedLoading ? 'not-allowed' : 'pointer', opacity: seedLoading ? 0.5 : 1 }}>
          {seedLoading ? '...' : '🔄 Сбросить'}
        </button>
      </div>

      {/* ── Product cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {products.map(p => {
          const qty = (p as any).quantity ?? 0
          return (
            <div key={p.id} style={{
              background: '#141414', border: '1px solid #242424',
              borderRadius: 14, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ position: 'relative' }}>
                {(p as any).image_url
                  ? <img src={(p as any).image_url} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: 150, background: '#1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🍞</div>
                }
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: p.is_visible ? 'rgba(20,83,45,0.9)' : 'rgba(69,10,10,0.9)',
                    color: p.is_visible ? '#4ade80' : '#f87171',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {p.is_visible ? 'Виден' : 'Скрыт'}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: qty > 0 ? 'rgba(20,83,45,0.9)' : 'rgba(69,10,10,0.9)',
                    color: qty > 0 ? '#4ade80' : '#f87171',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {qty > 0 ? `${qty} шт` : 'Нет'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '14px 16px', flex: 1 }}>
                <p style={{ margin: '0 0 2px', color: '#f0ece4', fontWeight: 700, fontSize: 15 }}>{(p as any).name_ru}</p>
                <p style={{ margin: '0 0 10px', color: '#6b7280', fontSize: 12 }}>{(p as any).name_uz}</p>
                <p style={{ margin: 0, color: '#c8a96e', fontWeight: 800, fontSize: 16 }}>
                  {p.price.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>сум</span>
                </p>
              </div>
              <div style={{ padding: '0 12px 14px', display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  setEditing({ ...p })
                  setDescriptionUz((p as any).description_uz || '')
                  setDescriptionRu((p as any).description_ru || '')
                  setPreviewImage((p as any).image_url || null)
                  setNameSearch((p as any).name_ru || '')
                  setIsNew(false)
                }} style={actionBtn('#3b82f6')}>✏️ Изменить</button>
                <button onClick={() => toggle(p)} style={actionBtn('#f59e0b')}>
                  {p.is_visible ? '🙈 Скрыть' : '👁 Показать'}
                </button>
                <button onClick={() => del(p.id)} style={actionBtn('#ef4444')}>🗑</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Edit / Create modal ── */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }}>
          {/* Backdrop */}
          <div
            onClick={() => { setEditing(null); setIsNew(false); resetForm() }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)' }}
          />
          {/* Panel */}
          <div style={{
            position: 'relative', zIndex: 1,
            marginLeft: 'auto', width: '100%', maxWidth: 520,
            background: '#0f0f0f', overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          }}>
            {/* Panel header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              background: '#0f0f0f', borderBottom: '1px solid #1e1e1e',
              padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              {previewImage && (
                <img src={previewImage} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: '#f0ece4', fontWeight: 800, fontSize: 18 }}>
                  {isNew ? 'Добавить товар' : 'Изменить товар'}
                </h2>
                {!isNew && <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 12 }}>{(editing as any).name_ru}</p>}
              </div>
              <button
                onClick={() => { setEditing(null); setIsNew(false); resetForm() }}
                style={{ width: 34, height: 34, background: '#1e1e1e', border: 'none', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            {/* Panel body */}
            <div style={{ padding: '20px 22px', flex: 1 }}>

              {/* Preset search */}
              <div style={section}>
                <span style={label}>🔍 Быстрый выбор</span>
                <input
                  placeholder="Начните вводить название..."
                  value={nameSearch}
                  onChange={e => { setNameSearch(e.target.value); setShowPresets(true) }}
                  style={inp}
                />
                {nameSearch.length > 0 && showPresets && (
                  <div style={{ border: '1px solid #2e2e2e', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
                    {BREAD_PRESETS.filter(pr =>
                      pr.name_ru.toLowerCase().includes(nameSearch.toLowerCase()) ||
                      pr.name_uz.toLowerCase().includes(nameSearch.toLowerCase())
                    ).map(pr => (
                      <div
                        key={pr.name_ru}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setNameSearch(pr.name_ru)
                          setEditing({ ...editing, name_ru: pr.name_ru, name_uz: pr.name_uz, image_url: pr.image_url })
                          setDescriptionRu(pr.description_ru)
                          setDescriptionUz(pr.description_uz)
                          setPreviewImage(pr.image_url)
                          setShowPresets(false)
                        }}
                        style={{ display: 'flex', gap: 12, padding: '10px 14px', cursor: 'pointer', alignItems: 'center', background: '#141414', borderBottom: '1px solid #1e1e1e' }}
                      >
                        <img src={pr.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                        <div>
                          <p style={{ margin: 0, color: '#f0ece4', fontWeight: 600, fontSize: 14 }}>{pr.name_ru}</p>
                          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 12 }}>{pr.name_uz}</p>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#c8a96e', fontSize: 12, fontWeight: 700 }}>Заполнить →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Names */}
              <div style={section}>
                <span style={label}>📝 Название</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#4b5563', fontSize: 11, fontWeight: 600 }}>RU</p>
                    <input value={(editing as any).name_ru || ''} onChange={e => setEditing({ ...editing, name_ru: e.target.value })} style={inp} placeholder="Название RU" />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#4b5563', fontSize: 11, fontWeight: 600 }}>UZ</p>
                    <input value={(editing as any).name_uz || ''} onChange={e => setEditing({ ...editing, name_uz: e.target.value })} style={inp} placeholder="Nomi UZ" />
                  </div>
                </div>
              </div>

              {/* Price + Quantity */}
              <div style={section}>
                <span style={label}>💰 Цена и количество</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#4b5563', fontSize: 11, fontWeight: 600 }}>Цена (сум)</p>
                    <input type="number"
                      value={((editing as any).price ?? 0) === 0 ? '' : (editing as any).price}
                      placeholder="0"
                      onChange={e => setEditing({ ...editing, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                      onFocus={e => e.target.select()}
                      style={inp}
                    />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#4b5563', fontSize: 11, fontWeight: 600 }}>Кол-во (шт)</p>
                    <input type="number"
                      value={((editing as any).quantity ?? 0) === 0 ? '' : (editing as any).quantity}
                      placeholder="0"
                      onChange={e => setEditing({ ...editing, quantity: e.target.value === '' ? 0 : Number(e.target.value) })}
                      onFocus={e => e.target.select()}
                      style={inp}
                    />
                  </div>
                </div>
              </div>

              {/* Image */}
              <div style={section}>
                <span style={label}>🖼 Картинка</span>
                {previewImage && (
                  <img src={previewImage} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 10, display: 'block' }} />
                )}
                <input
                  placeholder="/images/tabiiy-non.jpg"
                  value={(editing as any).image_url || ''}
                  onChange={e => { setEditing({ ...editing, image_url: e.target.value }); setPreviewImage(e.target.value || null) }}
                  style={inp}
                />
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: '0 0 4px', color: '#4b5563', fontSize: 11, fontWeight: 600 }}>Telegram File ID (необязательно)</p>
                  <input value={(editing as any).photo_file_id || ''} onChange={e => setEditing({ ...editing, photo_file_id: e.target.value })} style={inp} placeholder="AgACAgI..." />
                </div>
              </div>

              {/* Descriptions with tabs */}
              <div style={section}>
                <span style={label}>📄 Описание</span>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: '#0d0d0d', borderRadius: 8, padding: 3 }}>
                  {(['ru', 'uz'] as const).map(lang => (
                    <button key={lang} onClick={() => setDescTab(lang)} style={{
                      flex: 1, padding: '7px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      background: descTab === lang ? '#c8a96e' : 'transparent',
                      color: descTab === lang ? '#000' : '#6b7280',
                      transition: 'all .15s',
                    }}>
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                {descTab === 'ru'
                  ? <textarea value={descriptionRu} onChange={e => setDescriptionRu(e.target.value)} style={{ ...inp, minHeight: 180, resize: 'vertical' }} placeholder="Описание на русском..." />
                  : <textarea value={descriptionUz} onChange={e => setDescriptionUz(e.target.value)} style={{ ...inp, minHeight: 180, resize: 'vertical' }} placeholder="Ta'rif o'zbek tilida..." />
                }
              </div>

              {error && (
                <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                  <p style={{ margin: 0, color: '#fca5a5', fontSize: 13 }}>⚠️ {error}</p>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div style={{ position: 'sticky', bottom: 0, background: '#0f0f0f', borderTop: '1px solid #1e1e1e', padding: '14px 22px', display: 'flex', gap: 10 }}>
              <button onClick={save} disabled={loading} style={{
                flex: 1, padding: '13px', background: loading ? '#6b5a3e' : '#c8a96e',
                border: 'none', borderRadius: 10, color: '#000', fontWeight: 800,
                fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .15s',
              }}>
                {loading ? 'Сохраняем...' : isNew ? '✓ Создать товар' : '✓ Сохранить'}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false); resetForm() }}
                style={{ padding: '13px 18px', background: '#1e1e1e', border: 'none', borderRadius: 10, color: '#9ca3af', cursor: 'pointer', fontWeight: 600 }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const actionBtn = (color: string): React.CSSProperties => ({
  flex: 1, padding: '7px 10px',
  background: color + '18', border: `1px solid ${color}33`,
  borderRadius: 8, color, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', textAlign: 'center',
})
