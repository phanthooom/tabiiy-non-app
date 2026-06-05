export type OrderStatus = 'accepted' | 'packing' | 'courier_assigned' | 'delivered' | 'cancelled'

export interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: number
  status: OrderStatus
  delivery_type: 'delivery' | 'pickup'
  address: string | null
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  yandex_claim_id: string | null
  yandex_status: string | null
  created_at: string
  user: { id: number; full_name: string; username: string | null }
  items: OrderItem[]
}

export interface Product {
  id: number
  name_uz: string
  name_ru: string
  price: number
  quantity: number
  is_visible: boolean
  sort_order: number
  photo_file_id: string | null
  image_url: string | null
  description_uz?: string | null
  description_ru?: string | null
  description?: string | null
}

export interface User {
  id: number
  full_name: string
  username: string | null
  phone: string | null
  language: string
  is_active: boolean
  created_at: string
}

export interface PaginatedList<T> {
  items: T[]
  total: number
}

export interface CallDeliveryResult {
  claim_id: string
  price: number
}
