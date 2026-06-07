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
      fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=fcd5b77b-d255-480e-b530-ec10724a2275&geocode=${lon},${lat}&format=json&lang=${language === 'uz' ? 'uz_UZ' : 'ru_RU'}`)
        .then(res => res.json())
        .then(data => {
           const featureMember = data?.response?.GeoObjectCollection?.featureMember
           if (featureMember && featureMember.length > 0) {
             let name = featureMember[0].GeoObject.name
             let desc = featureMember[0].GeoObject.description
             let full = desc ? `${name}, ${desc}` : name
             setText(full.replace('Узбекистан, Ташкент, ', '').replace('Узбекистан, ', '').replace('Oʻzbekiston, Toshkent, ', ''))
           }
        })
        .catch(() => {})
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
