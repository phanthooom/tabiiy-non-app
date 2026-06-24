// ── Telegram Mini App SDK ──────────────────────────────────────────────────
export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    auth_date: number
    hash: string
  }
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  viewportHeight: number
  viewportStableHeight: number
  isExpanded: boolean
  expand(): void
  close(): void
  ready(): void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
    onClick(fn: () => void): void
    offClick(fn: () => void): void
    setText(text: string): void
  }
  BackButton: {
    isVisible: boolean
    show(): void
    hide(): void
    onClick(fn: () => void): void
    offClick(fn: () => void): void
  }
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback: (ok: boolean) => void): void
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

declare global {
  interface Window {
    /** Injected by `telegram-web-app.js`; absent if script blocked or unloaded. */
    Telegram?: { WebApp: TelegramWebApp }
  }
}

// ── API types ──────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string
  token_type: string
  user_id: number
  full_name: string
  language: 'ru' | 'uz'
}

export interface Product {
  id: number | string
  name: string
  name_uz: string
  name_ru: string
  price: number
  quantity: number
  photo_file_id: string | null
  image_url: string | null
  image_position?: string | null
  is_available: boolean
  description: string | null
  description_uz: string | null
  description_ru: string | null
}

export interface CartItem {
  product_id: number | string
  product_name: string
  product_name_uz?: string | null
  price: number
  quantity: number
  subtotal: number
  photo_file_id: string | null
  image_url: string | null
}

export interface Cart {
  items: CartItem[]
  total: number
  items_count: number
}

export interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  image_url: string | null
  photo_file_id: string | null
}

export interface Order {
  id: number | string
  status: string
  status_label: string
  delivery_type: 'delivery' | 'pickup'
  address: string | null
  total_amount: number
  created_at: string
  items: OrderItem[]
  yandex_claim_id: string | null
  yandex_tracking_url: string | null
}

export interface UserProfile {
  id: number | string
  full_name: string
  username: string | null
  phone: string | null
  language: 'ru' | 'uz'
  email?: string | null
  photo_url?: string | null
}

export type DeliveryType = 'delivery' | 'pickup'

export type Language = 'ru' | 'uz'

export interface PaginationMeta {
  page: number
  size: number
  total_count: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedOrders {
  items: Order[]
  meta: PaginationMeta
}
