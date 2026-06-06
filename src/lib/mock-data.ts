import type { Cart, Order, Product, UserProfile } from '@/types'

export const BYPASS_MODE = false

export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Obi Non',
    name_uz: 'Obi Non',
    name_ru: 'Оби Нон',
    description: 'The classic, traditional tandoor bread. Crisp on the outside, fluffy and warm on the inside.',
    description_uz: 'Samarqand non',
    description_ru: 'Самаркандская лепёшка',
    price: 12000,
    quantity: 50,
    photo_file_id: null,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
    is_available: true,
  },
  {
    id: 2,
    name: 'Patir Non',
    name_uz: 'Patir Non',
    name_ru: 'Патир Нон',
    description: 'A thinner, wider variety of flatbread, perfect for wrapping meats or dipping into sauces.',
    description_uz: 'Qatlamali non',
    description_ru: 'Слоёная лепёшка',
    price: 15000,
    quantity: 30,
    photo_file_id: null,
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=600&auto=format&fit=crop',
    is_available: true,
  },
  {
    id: 3,
    name: 'Issiq Non',
    name_uz: 'Issiq Non',
    name_ru: 'Иссик Нон',
    description: 'Served straight from the tandoor. "Issiq" meaning hot, this bread is softer and best eaten fresh.',
    description_uz: 'Tandirdan chiqqan issiq non',
    description_ru: 'Горячий хлеб из тандыра',
    price: 8000,
    quantity: 100,
    photo_file_id: null,
    image_url: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=600&auto=format&fit=crop',
    is_available: true,
  },
  {
    id: 4,
    name: 'Kulcha Non',
    name_uz: 'Kulcha Non',
    name_ru: 'Кулча Нон',
    description: 'Small, soft flatbread sprinkled with sesame seeds.',
    description_uz: 'Suvsam bilan yumshoq non',
    description_ru: 'Лепёшка с кунжутом',
    price: 10000,
    quantity: 45,
    photo_file_id: null,
    image_url: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=600&auto=format&fit=crop',
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
