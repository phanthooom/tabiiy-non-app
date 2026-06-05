import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type {
  AuthResponse, Cart, Order, Product, UserProfile,
  DeliveryType, PaginationMeta, PaginatedOrders,
} from '@/types'
import { invalidateAuthSession } from '@/lib/auth-invalidation'
import {
  apiEnvelopeSchema,
  authResponseSchema,
  cartSchema,
  orderSchema,
  paginatedOrdersSchema,
  parseOrThrow,
  productSchema,
  paginationMetaSchema,
  SchemaValidationError,
  userProfileSchema,
} from '@/lib/api-schemas'

export const BASE_URL = import.meta.env.VITE_API_URL ?? ''

type RequestConfig = AxiosRequestConfig & { signal?: AbortSignal }

interface ApiErrorBody {
  code: string
  message: string
}

interface ApiEnvelope<T> {
  data: T | null
  error: ApiErrorBody | null
  meta?: PaginationMeta | Record<string, unknown> | null
}

export class ApiClientError extends Error {
  code: string
  status?: number

  constructor(code: string, message: string, status?: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  // Token is set by AuthProvider after either DEV JWT or Telegram auth completes.
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined
    const url = error.config?.url as string | undefined
    const envelope = error.response?.data as ApiEnvelope<unknown> | undefined

    if (
      status === 401 &&
      url &&
      !url.includes('/api/auth/telegram') &&
      import.meta.env.VITE_BYPASS_AUTH !== 'true'
    ) {
      invalidateAuthSession()
    }

    if (envelope?.error) {
      return Promise.reject(new ApiClientError(envelope.error.code, envelope.error.message, status))
    }

    return Promise.reject(error)
  },
)

function validateEnvelope<T>(
  response: AxiosResponse<ApiEnvelope<T>>,
  dataSchema: import('zod').ZodType<T>,
  label: string,
): T {
  const envelope = parseOrThrow(
    apiEnvelopeSchema(dataSchema),
    response.data,
    `${label} envelope`,
  )
  if (envelope.error) {
    throw new ApiClientError(envelope.error.code, envelope.error.message, response.status)
  }
  if (envelope.data === null || envelope.data === undefined) {
    throw new ApiClientError('EMPTY_RESPONSE', 'Empty API response', response.status)
  }
  return envelope.data
}

function unwrapMeta(response: AxiosResponse<ApiEnvelope<unknown>>): PaginationMeta | undefined {
  const meta = response.data.meta
  if (!meta) return undefined
  const result = paginationMetaSchema.safeParse(meta)
  return result.success ? result.data : undefined
}

// ── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  telegram: (initData: string, config?: RequestConfig): Promise<AuthResponse> =>
    api.post<ApiEnvelope<AuthResponse>>('/api/auth/telegram', { init_data: initData }, config)
      .then(r => validateEnvelope(r, authResponseSchema, 'auth')),
}

// ── Products ─────────────────────────────────────────────────────────────

export const productsApi = {
  list: (config?: RequestConfig): Promise<Product[]> =>
    api.get<ApiEnvelope<Product[]>>('/api/products', config)
      .then(r => validateEnvelope(r, productSchema.array() as unknown as import('zod').ZodType<Product[]>, 'products')),

  get: (id: number, config?: RequestConfig): Promise<Product> =>
    api.get<ApiEnvelope<Product>>(`/api/products/${id}`, config)
      .then(r => validateEnvelope(r, productSchema as unknown as import('zod').ZodType<Product>, 'product')),
}

// ── Cart ──────────────────────────────────────────────────────────────────

export const cartApi = {
  get: (config?: RequestConfig): Promise<Cart> =>
    api.get<ApiEnvelope<Cart>>('/api/cart', config)
      .then(r => validateEnvelope(r, cartSchema, 'cart')),

  addItem: (product_id: number, quantity = 1, config?: RequestConfig): Promise<Cart> =>
    api.post<ApiEnvelope<Cart>>('/api/cart/items', { product_id, quantity }, config)
      .then(r => validateEnvelope(r, cartSchema, 'cart')),

  updateItem: (product_id: number, quantity: number, config?: RequestConfig): Promise<Cart> =>
    api.put<ApiEnvelope<Cart>>(`/api/cart/items/${product_id}`, { quantity }, config)
      .then(r => validateEnvelope(r, cartSchema, 'cart')),

  removeItem: (product_id: number, config?: RequestConfig): Promise<Cart> =>
    api.delete<ApiEnvelope<Cart>>(`/api/cart/items/${product_id}`, config)
      .then(r => validateEnvelope(r, cartSchema, 'cart')),

  clear: (config?: RequestConfig): Promise<void> =>
    api.delete<ApiEnvelope<Cart>>('/api/cart', config).then(() => undefined),
}

// ── Orders ────────────────────────────────────────────────────────────────

export const ordersApi = {
  create: (params: {
    delivery_type: DeliveryType
    address?: string
    address_comment?: string
  }, config?: RequestConfig): Promise<Order> => {
    if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
      return new Promise(resolve => setTimeout(() => resolve({
        id: Math.floor(Math.random() * 10000),
        user_id: 1,
        status: 'accepted',
        status_label: 'Accepted',
        total_amount: 12000,
        delivery_type: params.delivery_type,
        address: params.address || null,
        address_comment: params.address_comment || null,
        yandex_claim_id: null,
        created_at: new Date().toISOString(),
        items: []
      }), 800))
    }
    return api.post<ApiEnvelope<Order>>('/api/orders', params, config)
      .then(r => validateEnvelope(r, orderSchema, 'order'))
  },

  list: async (
    params?: { page?: number; size?: number },
    config?: RequestConfig,
  ): Promise<PaginatedOrders> => {
    const response = await api.get<ApiEnvelope<Order[]>>('/api/orders', { ...config, params })
    const items = validateEnvelope(response, orderSchema.array(), 'orders')
    const meta = unwrapMeta(response)
    const result = {
      items,
      meta: meta ?? {
        page: params?.page ?? 1,
        size: params?.size ?? 20,
        total_count: items.length,
        has_next: false,
        has_prev: (params?.page ?? 1) > 1,
      },
    }
    return parseOrThrow(paginatedOrdersSchema, result, 'paginatedOrders')
  },

  get: (id: number, config?: RequestConfig): Promise<Order> =>
    api.get<ApiEnvelope<Order>>(`/api/orders/${id}`, config)
      .then(r => validateEnvelope(r, orderSchema, 'order')),
}

// ── Users ─────────────────────────────────────────────────────────────────

export const usersApi = {
  me: (config?: RequestConfig): Promise<UserProfile> =>
    api.get<ApiEnvelope<UserProfile>>('/api/users/me', config)
      .then(r => validateEnvelope(r, userProfileSchema, 'user')),

  update: (data: { phone?: string; language?: 'ru' | 'uz' }, config?: RequestConfig): Promise<UserProfile> =>
    api.patch<ApiEnvelope<UserProfile>>('/api/users/me', data, config)
      .then(r => validateEnvelope(r, userProfileSchema, 'user')),
}

/** Photo proxy URL — browser loads directly; failures handled in UI via ProductPhoto. */
export function photoUrl(fileId: string): string {
  return `/api/photo/${encodeURIComponent(fileId)}`
}

/** Extract user-facing message from API or axios errors. */
export function apiErrorMessage(err: unknown, fallback = 'Error'): string {
  if (err instanceof ApiClientError) return err.message
  if (err instanceof SchemaValidationError) return err.message
  const axiosErr = err as { response?: { data?: ApiEnvelope<unknown> } }
  return axiosErr.response?.data?.error?.message ?? fallback
}

export { SchemaValidationError }
