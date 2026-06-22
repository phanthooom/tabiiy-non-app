import { useEffect, useState } from 'react'
import { productsApi } from '../api/index'
import type { Product } from '../types/index'
import { Package, Pencil, Eye, EyeOff, Trash2, Plus, RotateCcw, Check } from 'lucide-react'

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

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: 10, color: '#111827', fontSize: 14,
  boxSizing: 'border-box', outline: 'none', transition: 'border-color .15s',
  fontFamily: 'inherit',
}

const fieldLabel: React.CSSProperties = {
  display: 'block', color: '#9ca3af', fontSize: 11,
  fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', marginBottom: 6,
}

const sectionBox: React.CSSProperties = {
  background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: 12, padding: '16px 18px', marginBottom: 12,
}

export function ProductsPage() {
  const [products, setProducts]           = useState<Product[]>([])
  const [editing, setEditing]             = useState<Partial<Product> | null>(null)
  const [isNew, setIsNew]                 = useState(false)
  const [loading, setLoading]             = useState(false)
  const [seedLoading, setSeedLoading]     = useState(false)
  const [error, setError]                 = useState('')
  const [nameSearch, setNameSearch]       = useState('')
  const [descriptionUz, setDescriptionUz] = useState('')
  const [descriptionRu, setDescriptionRu] = useState('')
  const [previewImage, setPreviewImage]   = useState<string | null>(null)
  const [showPresets, setShowPresets]     = useState(false)
  const [stockMap, setStockMap]           = useState<Record<string, number>>({})
  const [stockSaving, setStockSaving]     = useState<Record<string, boolean>>({})
  const [descTab, setDescTab]             = useState<'ru' | 'uz'>('ru')

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

      {/* Stock panel */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: '20px',
        marginBottom: 24,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, background: '#fef9ec',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Package size={18} color="#d97706" />
          </div>
          <h3 style={{ margin: 0, color: '#111827', fontWeight: 800, fontSize: 16 }}>Запас на сегодня</h3>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
            обновляется мгновенно
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(p => {
            const id     = String(p.id)
            const qty    = stockMap[id] ?? 0
            const saving = stockSaving[id]
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f9fafb', borderRadius: 12, padding: '10px 10px',
                border: `1px solid ${qty > 0 ? '#bbf7d0' : '#fecaca'}`,
              }}>
                {(p as any).image_url && (
                  <img
                    src={(p as any).image_url}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p as any).name_ru}</p>
                  <p style={{ margin: '1px 0 0', color: '#9ca3af', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p as any).name_uz}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <button
                    onClick={() => { const n = Math.max(0, qty - 1); setStockMap(m => ({ ...m, [id]: n })); saveStock(p, n) }}
                    style={{
                      width: 30, height: 30, background: '#ffffff',
                      border: '1px solid #e5e7eb', borderRadius: 8,
                      color: '#374151', fontSize: 18, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}
                  >−</button>
                  <input
                    type="number" min={0} value={qty}
                    onChange={e => setStockMap(m => ({ ...m, [id]: Math.max(0, Number(e.target.value)) }))}
                    onBlur={e => saveStock(p, Math.max(0, Number(e.target.value)))}
                    style={{
                      width: 50, textAlign: 'center',
                      background: '#ffffff', border: '1px solid #e5e7eb',
                      borderRadius: 8, color: '#111827',
                      padding: '5px 2px', fontSize: 15, fontWeight: 800, outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={() => { const n = qty + 1; setStockMap(m => ({ ...m, [id]: n })); saveStock(p, n) }}
                    style={{
                      width: 30, height: 30, background: '#c8a96e',
                      border: 'none', borderRadius: 8,
                      color: '#111827', fontSize: 18, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}
                  >+</button>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  {saving
                    ? <span style={{ color: '#9ca3af', fontSize: 11 }}>...</span>
                    : <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: 20,
                        fontSize: 10, fontWeight: 700,
                        background: qty > 0 ? '#dcfce7' : '#fee2e2',
                        color: qty > 0 ? '#16a34a' : '#dc2626',
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

      {/* Header actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <h2 style={{ margin: 0, flex: 1, color: '#111827', fontWeight: 800, fontSize: 18 }}>Товары</h2>
        <button
          onClick={() => { resetForm(); setEditing(empty); setIsNew(true) }}
          style={{
            padding: '9px 18px', background: '#c8a96e',
            border: 'none', borderRadius: 10, color: '#111827',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={15} /> Добавить
        </button>
        <button
          onClick={seedProducts}
          disabled={seedLoading}
          style={{
            padding: '9px 14px', background: '#f9fafb',
            border: '1px solid #e5e7eb', borderRadius: 10,
            color: '#6b7280', fontWeight: 600, fontSize: 13,
            cursor: seedLoading ? 'not-allowed' : 'pointer',
            opacity: seedLoading ? 0.5 : 1, fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          {seedLoading ? '...' : <><RotateCcw size={13} /> Сбросить</>}
        </button>
      </div>

      {/* Product grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {products.map(p => {
          const qty = (p as any).quantity ?? 0
          return (
            <div key={p.id} style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 16, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ position: 'relative' }}>
                {(p as any).image_url
                  ? <img src={(p as any).image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: 140, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={32} color="#d1d5db" />
                    </div>
                }
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 5 }}>
                  <span style={{
                    padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: p.is_visible ? 'rgba(220,252,231,0.95)' : 'rgba(254,226,226,0.95)',
                    color: p.is_visible ? '#16a34a' : '#dc2626',
                  }}>
                    {p.is_visible ? 'Виден' : 'Скрыт'}
                  </span>
                  <span style={{
                    padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: qty > 0 ? 'rgba(220,252,231,0.95)' : 'rgba(254,226,226,0.95)',
                    color: qty > 0 ? '#16a34a' : '#dc2626',
                  }}>
                    {qty > 0 ? `${qty} шт` : 'Нет'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '12px 14px', flex: 1 }}>
                <p style={{ margin: '0 0 2px', color: '#111827', fontWeight: 700, fontSize: 14 }}>{(p as any).name_ru}</p>
                <p style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: 12 }}>{(p as any).name_uz}</p>
                <p style={{ margin: 0, color: '#c8a96e', fontWeight: 800, fontSize: 15 }}>
                  {p.price.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>сум</span>
                </p>
              </div>
              <div style={{ padding: '0 10px 12px', display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    setEditing({ ...p })
                    setDescriptionUz((p as any).description_uz || '')
                    setDescriptionRu((p as any).description_ru || '')
                    setPreviewImage((p as any).image_url || null)
                    setNameSearch((p as any).name_ru || '')
                    setIsNew(false)
                  }}
                  style={actionBtn('#3b82f6')}
                >
                  <Pencil size={12} /> Изменить
                </button>
                <button onClick={() => toggle(p)} style={actionBtn('#f59e0b')}>
                  {p.is_visible ? <><EyeOff size={12} /> Скрыть</> : <><Eye size={12} /> Показать</>}
                </button>
                <button onClick={() => del(p.id)} style={{ ...actionBtn('#ef4444'), flex: 'none', padding: '7px 10px' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit / Create drawer */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }}>
          <div
            onClick={() => { setEditing(null); setIsNew(false); resetForm() }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            marginLeft: 'auto', width: '100%', maxWidth: 520,
            background: '#ffffff', overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
          }}>
            {/* Drawer header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              background: '#ffffff', borderBottom: '1px solid #e5e7eb',
              padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {previewImage && (
                <img src={previewImage} style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: '#111827', fontWeight: 800, fontSize: 17 }}>
                  {isNew ? 'Добавить товар' : 'Изменить товар'}
                </h2>
                {!isNew && (
                  <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: 12 }}>{(editing as any).name_ru}</p>
                )}
              </div>
              <button
                onClick={() => { setEditing(null); setIsNew(false); resetForm() }}
                style={{
                  width: 32, height: 32, background: '#f3f4f6',
                  border: 'none', borderRadius: 8, color: '#6b7280',
                  cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            {/* Drawer body */}
            <div style={{ padding: '20px', flex: 1 }}>

              {/* Preset search */}
              <div style={sectionBox}>
                <span style={fieldLabel}>Быстрый выбор</span>
                <input
                  placeholder="Начните вводить название..."
                  value={nameSearch}
                  onChange={e => { setNameSearch(e.target.value); setShowPresets(true) }}
                  style={inp}
                />
                {nameSearch.length > 0 && showPresets && (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
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
                        style={{
                          display: 'flex', gap: 12, padding: '10px 14px',
                          cursor: 'pointer', alignItems: 'center',
                          background: '#f9fafb', borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <img src={pr.image_url} alt="" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 8 }} />
                        <div>
                          <p style={{ margin: 0, color: '#111827', fontWeight: 600, fontSize: 13 }}>{pr.name_ru}</p>
                          <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: 11 }}>{pr.name_uz}</p>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#c8a96e', fontSize: 12, fontWeight: 700 }}>Заполнить →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Names */}
              <div style={sectionBox}>
                <span style={fieldLabel}>Название</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>RU</p>
                    <input
                      value={(editing as any).name_ru || ''}
                      onChange={e => setEditing({ ...editing, name_ru: e.target.value })}
                      style={inp} placeholder="Название RU"
                    />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>UZ</p>
                    <input
                      value={(editing as any).name_uz || ''}
                      onChange={e => setEditing({ ...editing, name_uz: e.target.value })}
                      style={inp} placeholder="Nomi UZ"
                    />
                  </div>
                </div>
              </div>

              {/* Price + Quantity */}
              <div style={sectionBox}>
                <span style={fieldLabel}>Цена и количество</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>Цена (сум)</p>
                    <input
                      type="number"
                      value={((editing as any).price ?? 0) === 0 ? '' : (editing as any).price}
                      placeholder="0"
                      onChange={e => setEditing({ ...editing, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                      onFocus={e => e.target.select()}
                      style={inp}
                    />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>Кол-во сейчас (шт)</p>
                    <input
                      type="number"
                      value={((editing as any).quantity ?? 0) === 0 ? '' : (editing as any).quantity}
                      placeholder="0"
                      onChange={e => setEditing({ ...editing, quantity: e.target.value === '' ? 0 : Number(e.target.value) })}
                      onFocus={e => e.target.select()}
                      style={inp}
                    />
                  </div>
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>
                    Остаток по умолч. (авто-сброс каждый день)
                  </p>
                  <input
                    type="number"
                    value={((editing as any).default_quantity ?? 0) === 0 ? '' : (editing as any).default_quantity}
                    placeholder="Напр. 50 — каждое утро будет автоматически выставляться"
                    onChange={e => setEditing({ ...editing, default_quantity: e.target.value === '' ? 0 : Number(e.target.value) } as any)}
                    onFocus={e => e.target.select()}
                    style={{ ...inp, borderColor: '#fcd34d' }}
                  />
                </div>
              </div>

              {/* Image */}
              <div style={sectionBox}>
                <span style={fieldLabel}>Картинка</span>
                {previewImage && (
                  <img src={previewImage} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10, marginBottom: 10, display: 'block' }} />
                )}
                <input
                  placeholder="/images/tabiiy-non.jpg"
                  value={(editing as any).image_url || ''}
                  onChange={e => { setEditing({ ...editing, image_url: e.target.value }); setPreviewImage(e.target.value || null) }}
                  style={inp}
                />
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>
                    Telegram File ID (необязательно)
                  </p>
                  <input
                    value={(editing as any).photo_file_id || ''}
                    onChange={e => setEditing({ ...editing, photo_file_id: e.target.value })}
                    style={inp} placeholder="AgACAgI..."
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div style={sectionBox}>
                <span style={fieldLabel}>Описание</span>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
                  {(['ru', 'uz'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setDescTab(lang)}
                      style={{
                        flex: 1, padding: '7px', border: 'none', borderRadius: 6,
                        cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        background: descTab === lang ? '#c8a96e' : 'transparent',
                        color: descTab === lang ? '#111827' : '#9ca3af',
                        transition: 'all .15s', fontFamily: 'inherit',
                      }}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                {descTab === 'ru'
                  ? <textarea
                      value={descriptionRu}
                      onChange={e => setDescriptionRu(e.target.value)}
                      style={{ ...inp, minHeight: 180, resize: 'vertical' }}
                      placeholder="Описание на русском..."
                    />
                  : <textarea
                      value={descriptionUz}
                      onChange={e => setDescriptionUz(e.target.value)}
                      style={{ ...inp, minHeight: 180, resize: 'vertical' }}
                      placeholder="Ta'rif o'zbek tilida..."
                    />
                }
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                }}>
                  <p style={{ margin: 0, color: '#dc2626', fontSize: 13 }}>{error}</p>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div style={{
              position: 'sticky', bottom: 0,
              background: '#ffffff', borderTop: '1px solid #e5e7eb',
              padding: '14px 20px', display: 'flex', gap: 10,
            }}>
              <button
                onClick={save}
                disabled={loading}
                style={{
                  flex: 1, padding: '13px',
                  background: loading ? '#f3f4f6' : '#c8a96e',
                  border: 'none', borderRadius: 10,
                  color: loading ? '#9ca3af' : '#111827',
                  fontWeight: 800, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background .15s', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {loading ? 'Сохраняем...' : <><Check size={15} /> {isNew ? 'Создать товар' : 'Сохранить'}</>}
              </button>
              <button
                onClick={() => { setEditing(null); setIsNew(false); resetForm() }}
                style={{
                  padding: '13px 18px', background: '#f9fafb',
                  border: '1px solid #e5e7eb', borderRadius: 10,
                  color: '#6b7280', cursor: 'pointer',
                  fontWeight: 600, fontFamily: 'inherit',
                }}
              >
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
  flex: 1, padding: '7px 8px',
  background: color + '12', border: `1px solid ${color}30`,
  borderRadius: 8, color, fontSize: 11, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
})
