import type { Cart, Order, Product, UserProfile } from '@/types'

export const BYPASS_MODE = import.meta.env.VITE_BYPASS_AUTH === 'true'

export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Obi Non',
    name_uz: 'Obi Non',
    name_ru: 'Оби Нон',
    description: 'Традиционная самаркандская лепёшка',
    description_uz: 'Samarqand non',
    description_ru: 'Самаркандская лепёшка',
    price: 12000,
    quantity: 50,
    photo_file_id: null,
    image_url: null,
    is_available: true,
  },
  {
    id: 2,
    name: 'Patir Non',
    name_uz: 'Patir Non',
    name_ru: 'Патир Нон',
    description: 'Хрустящая слоёная лепёшка',
    description_uz: 'Qatlamali non',
    description_ru: 'Слоёная лепёшка',
    price: 15000,
    quantity: 30,
    photo_file_id: null,
    image_url: null,
    is_available: true,
  },
  {
    id: 3,
    name: 'Issiq Non',
    name_uz: 'Issiq Non',
    name_ru: 'Иссик Нон',
    description: 'Свежий горячий хлеб из тандыра',
    description_uz: 'Tandirdan chiqqan issiq non',
    description_ru: 'Горячий хлеб из тандыра',
    price: 8000,
    quantity: 100,
    photo_file_id: null,
    image_url: null,
    is_available: true,
  },
  {
    id: 4,
    name: 'Kulcha Non',
    name_uz: 'Kulcha Non',
    name_ru: 'Кулча Нон',
    description: 'Мягкая лепёшка с кунжутом',
    description_uz: 'Suvsam bilan yumshoq non',
    description_ru: 'Лепёшка с кунжутом',
    price: 10000,
    quantity: 45,
    photo_file_id: null,
    image_url: null,
    is_available: true,
  },
]

export const mockCart: Cart = {
  items: [],
  total: 0,
  items_count: 0,
}

export const mockOrders: Order[] = []

export const mockUser: UserProfile = {
  id: 1,
  full_name: 'Demo User',
  username: 'demo',
  phone: null,
  language: 'ru',
}
