/**
 * seed-products.mjs
 * Запуск: node seed-products.mjs
 *
 * Заполняет коллекцию `products` в Firestore.
 * Отредактируй массив PRODUCTS ниже перед запуском.
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAam7HY4vTF_s7ySXJfh53jnzYYISTy3g8",
  authDomain: "tabiiy-non.firebaseapp.com",
  projectId: "tabiiy-non",
  storageBucket: "tabiiy-non.firebasestorage.app",
  messagingSenderId: "936547463418",
  appId: "1:936547463418:web:4e04ecc46be445a08f9943",
}

// ─────────────────────────────────────────────
// ОТРЕДАКТИРУЙ ЭТОТ СПИСОК
// ─────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 1,
    name_ru: 'Оби Нон',
    name_uz: 'Obi Non',
    price: 12000,
    quantity: 50,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
    description_ru: 'Самаркандская лепёшка',
    description_uz: 'Samarqand noni',
  },
  {
    id: 2,
    name_ru: 'Патир Нон',
    name_uz: 'Patir Non',
    price: 15000,
    quantity: 30,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=600&auto=format&fit=crop',
    description_ru: 'Слоёная лепёшка',
    description_uz: 'Qatlamali non',
  },
  {
    id: 3,
    name_ru: 'Иссик Нон',
    name_uz: 'Issiq Non',
    price: 8000,
    quantity: 100,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=600&auto=format&fit=crop',
    description_ru: 'Горячий хлеб из тандыра',
    description_uz: 'Tandirdan chiqqan issiq non',
  },
  {
    id: 4,
    name_ru: 'Кулча Нон',
    name_uz: 'Kulcha Non',
    price: 10000,
    quantity: 45,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=600&auto=format&fit=crop',
    description_ru: 'Лепёшка с кунжутом',
    description_uz: 'Suvsam bilan yumshoq non',
  },
]
// ─────────────────────────────────────────────

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log(`Добавляю ${PRODUCTS.length} продуктов...`)

for (const product of PRODUCTS) {
  const { id, ...data } = product
  await setDoc(doc(db, 'products', String(id)), data)
  console.log(`  ✓ ${data.name_ru} (id=${id}, цена=${data.price})`)
}

console.log('\nГотово! Открой Firebase Console → Firestore → products чтобы проверить.')
process.exit(0)
