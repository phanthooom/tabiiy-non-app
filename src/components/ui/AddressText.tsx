import { useState, useEffect } from 'react'

const COORDS_RE = /^-?\d+\.\d+,\s*-?\d+\.\d+$/

function isCoordString(s: string) {
  return COORDS_RE.test(s)
}

export function AddressText({ address, language, clickable = true }: { address: string; language: string; clickable?: boolean }) {
  const coords = isCoordString(address)
  const loadingLabel = language === 'uz' ? 'Manzil aniqlanmoqda...' : 'Определение адреса...'
  const [text, setText] = useState(coords ? loadingLabel : address)

  useEffect(() => {
    if (!isCoordString(address)) {
      setText(address)
      return
    }

    setText(loadingLabel)
    const parts = address.split(',')
    const lat = parts[0].trim()
    const lon = parts[1].trim()

    const resolveAddress = async () => {
      // Primary: Nominatim (OpenStreetMap)
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': language === 'uz' ? 'uz' : 'ru' } }
        )
        if (resp.ok) {
          const data = await resp.json()
          if (data?.display_name) return data.display_name
        }
      } catch {}

      // Fallback: Yandex REST
      try {
        const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=fcd5b77b-d255-480e-b530-ec10724a2275&geocode=${lon},${lat}&format=json&lang=${language === 'uz' ? 'uz_UZ' : 'ru_RU'}`)
        if (res.ok) {
          const data = await res.json()
          const featureMember = data?.response?.GeoObjectCollection?.featureMember
          if (featureMember?.length > 0) {
            const name = featureMember[0].GeoObject.name
            const desc = featureMember[0].GeoObject.description
            return desc ? `${name}, ${desc}` : name
          }
        }
      } catch {}

      return language === 'uz' ? 'Tanlangan manzil' : 'Выбранная локация'
    }

    resolveAddress().then(setText).catch(() => setText(language === 'uz' ? 'Tanlangan manzil' : 'Выбранная локация'))
  }, [address, language])

  if (!clickable) return <>{text}</>

  let link = ''
  if (coords) {
    const parts = address.split(',')
    link = `https://yandex.ru/maps/?pt=${parts[1].trim()},${parts[0].trim()}&z=18&l=map`
  } else {
    link = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`
  }

  return (
    <a 
      href={link} 
      target="_blank" 
      rel="noreferrer" 
      onClick={(e) => e.stopPropagation()}
      style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: '#cbd5e1', textUnderlineOffset: 2, cursor: 'pointer' }}
    >
      {text}
    </a>
  )
}
