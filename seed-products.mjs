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
    name_ru: 'Tabiiy non',
    name_uz: 'Tabiiy non',
    price: 7000,
    quantity: 50,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
    description_ru: `🍞 Tabiiy non

🌾 Tarkibi: Bug'doy uni, suv, tuz va xamirturish
⚖️ Vazni: 550 gr
💵 Narxi: 7 000 so'm

✨ Foydali va shifobaxsh xususiyatlari:

Oson hazm bo‘ladi: Tabiiy xamirturish sababli oshqozonda og‘irlik va dam bo‘lishini keltirib chiqarmaydi.

Ichaklar uchun foydali: Ichak mikroflorasini yaxshilaydi va hazm tizimini tartibga soladi.

Qon shakarini me'yorda ushlaydi: Glyukozaning keskin ko‘tarilishini oldini oladi va uzoq vaqt to‘qlik hissini beradi.

Minerallarga boy: Don tarkibidagi foydali elementlar va temirning organizmga oson so‘rilishiga yordam beradi.

100% ziyonsiz: Tarkibida sun'iy kimyoviy qo‘shimchalar, drojji va konservantlar yo‘q.

Sog‘lom ovqatlanish va oshqozon-ichak tizimini asrash uchun eng yaxshi tanlov!`,
    description_uz: `🍞 Tabiiy non

🌾 Tarkibi: Bug'doy uni, suv, tuz va xamirturish
⚖️ Vazni: 550 gr
💵 Narxi: 7 000 so'm

✨ Foydali va shifobaxsh xususiyatlari:

Oson hazm bo‘ladi: Tabiiy xamirturish sababli oshqozonda og‘irlik va dam bo‘lishini keltirib chiqarmaydi.

Ichaklar uchun foydali: Ichak mikroflorasini yaxshilaydi va hazm tizimini tartibga soladi.

Qon shakarini me'yorda ushlaydi: Glyukozaning keskin ko‘tarilishini oldini oladi va uzoq vaqt to‘qlik hissini beradi.

Minerallarga boy: Don tarkibidagi foydali elementlar va temirning organizmga oson so‘rilishiga yordam beradi.

100% ziyonsiz: Tarkibida sun'iy kimyoviy qo‘shimchalar, drojji va konservantlar yo‘q.

Sog‘lom ovqatlanish va oshqozon-ichak tizimini asrash uchun eng yaxshi tanlov!`,
  },
  {
    id: 2,
    name_ru: 'Miks non',
    name_uz: 'Miks non',
    price: 10000,
    quantity: 30,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=600&auto=format&fit=crop',
    description_ru: `🍞 Miks non

🌾 Tarkibi: Arpa uni, bug'doy uni, makkajo'xori uni, sabzi soki, tuz va xamirturish
⚖️ Vazni: 600 gr
💵 Narxi: 10 000 so'm

✨ Foydali va shifobaxsh xususiyatlari:

Uch karra kuchli vitaminlar: Arpa, bug‘doy va makkajo‘xori unining aralashmasi organizmni barcha zarur minerallar va kletchatka bilan ta'minlaydi.

Ko‘z va teri uchun foydali: Tarkibidagi tabiiy sabzi soki vitamin A ga boy bo‘lib, ko‘rish qobiliyatini va immun tizimini mustahkamlaydi.

Modda almashinuvini yaxshilaydi: Arpa va makkajo‘xori uni ovqat hazm qilishni tezlashtiradi, qon tomirlarini tozalashga yordam beradi.

Uzoq vaqt to‘q tutadi: Murakkab uglevodlarga boy bo‘lgani uchun energiyani uzoq vaqt ushlab turadi va ortiqcha vazndan qochishga yordam beradi.

100% tabiiy va toza: Sun'iy kimyoviy qo‘shimchalarsiz, faqat tabiiy mahsulotlardan tayyorlangan.

Sog‘lik va energiya manbai bo‘lgan haqiqiy vitaminlar miksi!`,
    description_uz: `🍞 Miks non

🌾 Tarkibi: Arpa uni, bug'doy uni, makkajo'xori uni, sabzi soki, tuz va xamirturish
⚖️ Vazni: 600 gr
💵 Narxi: 10 000 so'm

✨ Foydali va shifobaxsh xususiyatlari:

Uch karra kuchli vitaminlar: Arpa, bug‘doy va makkajo‘xori unining aralashmasi organizmni barcha zarur minerallar va kletchatka bilan ta'minlaydi.

Ko‘z va teri uchun foydali: Tarkibidagi tabiiy sabzi soki vitamin A ga boy bo‘lib, ko‘rish qobiliyatini va immun tizimini mustahkamlaydi.

Modda almashinuvini yaxshilaydi: Arpa va makkajo‘xori uni ovqat hazm qilishni tezlashtiradi, qon tomirlarini tozalashga yordam beradi.

Uzoq vaqt to‘q tutadi: Murakkab uglevodlarga boy bo‘lgani uchun energiyani uzoq vaqt ushlab turadi va ortiqcha vazndan qochishga yordam beradi.

100% tabiiy va toza: Sun'iy kimyoviy qo‘shimchalarsiz, faqat tabiiy mahsulotlardan tayyorlangan.

Sog‘lik va energiya manbai bo‘lgan haqiqiy vitaminlar miksi!`,
  },
  {
    id: 3,
    name_ru: 'Patir non',
    name_uz: 'Patir non',
    price: 15000,
    quantity: 100,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=600&auto=format&fit=crop',
    description_ru: `🍞 Patir non

🌾 Tarkibi: Oliy navli bug'doy uni, sariyog', sut, suv, tuz va xamirturish
⚖️ Vazni: 700 gr
💵 Narxi: 15 000 so'm

✨ Foydali va shifobaxsh xususiyatlari:

Quvvat baxsh etadi: Sariyog' va sut bilan qorilgan xamir uzoq vaqtga energiya beradi.

Yurak va qon tomirlariga foydali: Sut tarkibidagi kalsiy va sariyog' oqsillari organizmni mustahkamlaydi.

Mazza va kayfiyat: Qatlamali va xushbo'y ta'm asab tizimini tinchlantirib, kayfiyatni ko'taradi.

Bolalar uchun sevimli: Tabiiy sutli tarkibi suyaklarning o'sishi va rivojlanishiga yordam beradi.

100% tabiiy: Faqatgina tabiiy sariyog' va toza sutdan foydalanib yopilgan haqiqiy o'zbek patiri!

Shohona dasturxonlarning ko'rki bo'lgan, mazzasi og'izda eriydigan patir non!`,
    description_uz: `🍞 Patir non

🌾 Tarkibi: Oliy navli bug'doy uni, sariyog', sut, suv, tuz va xamirturish
⚖️ Vazni: 700 gr
💵 Narxi: 15 000 so'm

✨ Foydali va shifobaxsh xususiyatlari:

Quvvat baxsh etadi: Sariyog' va sut bilan qorilgan xamir uzoq vaqtga energiya beradi.

Yurak va qon tomirlariga foydali: Sut tarkibidagi kalsiy va sariyog' oqsillari organizmni mustahkamlaydi.

Mazza va kayfiyat: Qatlamali va xushbo'y ta'm asab tizimini tinchlantirib, kayfiyatni ko'taradi.

Bolalar uchun sevimli: Tabiiy sutli tarkibi suyaklarning o'sishi va rivojlanishiga yordam beradi.

100% tabiiy: Faqatgina tabiiy sariyog' va toza sutdan foydalanib yopilgan haqiqiy o'zbek patiri!

Shohona dasturxonlarning ko'rki bo'lgan, mazzasi og'izda eriydigan patir non!`,
  }
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
