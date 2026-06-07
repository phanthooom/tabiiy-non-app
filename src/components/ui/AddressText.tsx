import { useState, useEffect } from 'react'

export function AddressText({ address, language, clickable = true }: { address: string; language: string; clickable?: boolean }) {
  const [text, setText] = useState(address)

  useEffect(() => {
    setText(address)
    const isCoords = /^\d+\.\d+,\s*\d+\.\d+$/.test(address) || /^\d+\.\d+,\d+\.\d+$/.test(address)
    if (isCoords) {
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
            const a = data?.address
            if (a) {
              const road = a.road || a.pedestrian || a.neighbourhood || a.suburb || ''
              const house = a.house_number ? ` ${a.house_number}` : ''
              const city = a.city || a.town || a.village || ''
              const text = road ? `${road}${house}${city ? ', ' + city : ''}` : (data.display_name || '')
              if (text) return text
            }
          }
        } catch {}

        // Fallback: Yandex REST
        try {
          const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=fcd5b77b-d255-480e-b530-ec10724a2275&geocode=${lon},${lat}&format=json&lang=${language === 'uz' ? 'uz_UZ' : 'ru_RU'}`)
          if (res.ok) {
            const data = await res.json()
            const featureMember = data?.response?.GeoObjectCollection?.featureMember
            if (featureMember && featureMember.length > 0) {
              let name = featureMember[0].GeoObject.name
              let desc = featureMember[0].GeoObject.description
              let full = desc ? `${name}, ${desc}` : name
              return full.replace('Узбекистан, Ташкент, ', '').replace('Узбекистан, ', '').replace('Oʻzbekiston, Toshkent, ', '')
            }
          }
        } catch {}

        return address
      }

      resolveAddress().then(setText).catch(() => {})
    }
  }, [address, language])

  const isCoords = /^\d+\.\d+,\s*\d+\.\d+$/.test(address) || /^\d+\.\d+,\d+\.\d+$/.test(address)
  
  if (!clickable) return <>{text}</>

  let link = ''
  if (isCoords) {
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
