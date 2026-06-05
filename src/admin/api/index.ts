import axios, { AxiosHeaders, type AxiosResponse } from 'axios'
import { getStoredAdminToken } from '../lib/token'
import { useAuthStore } from '../store/auth'
import type {
  CallDeliveryResult,
  Order,
  PaginatedList,
  Product,
  User,
} from '../types/index'

export { ADMIN_TOKEN_KEY, getStoredAdminToken } from '../lib/token'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

type AdminEnvelope<T> = {
  data: T | null
  error: { code: string; message: string } | null
  meta?: unknown
}

function isEnvelope(body: unknown): body is AdminEnvelope<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    'data' in body &&
    'error' in body
  )
}

export function unwrapAdminResponse<T>(response: AxiosResponse<unknown>): T {
  const body = response.data
  if (isEnvelope(body)) {
    if (body.error) {
      throw new Error(body.error.message)
    }
    if (body.data === null || body.data === undefined) {
      throw new Error('Empty API response')
    }
    return body.data as T
  }
  return body as T
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const url = config.url ?? ''
  if (url.includes('/api/admin/login')) {
    return config
  }

  const token = getStoredAdminToken()
  if (token) {
    const headers = AxiosHeaders.from(config.headers)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status as number | undefined
    const url = (error.config?.url as string | undefined) ?? ''

    if (status === 401 && !url.includes('/api/admin/login')) {
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  },
)

export interface AdminLoginResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  login: (username: string, password: string): Promise<AdminLoginResponse> =>
    api
      .post('/api/admin/login', { username, password })
      .then(r => unwrapAdminResponse<AdminLoginResponse>(r)),
}

export const ordersApi = {
  list: (params?: { status?: string; page?: number; size?: number }): Promise<PaginatedList<Order>> =>
    api.get('/api/admin/orders', { params }).then(r => unwrapAdminResponse<PaginatedList<Order>>(r)),
  updateStatus: (id: number, status: string): Promise<Order> =>
    api.patch(`/api/admin/orders/${id}/status`, { status }).then(r => unwrapAdminResponse<Order>(r)),
  callDelivery: (id: number): Promise<CallDeliveryResult> =>
    api.post(`/api/admin/orders/${id}/call-delivery`).then(r => unwrapAdminResponse<CallDeliveryResult>(r)),
  deliveryStatus: (id: number): Promise<unknown> =>
    api.get(`/api/admin/orders/${id}/delivery-status`).then(r => unwrapAdminResponse(r)),
  cancelDelivery: (id: number): Promise<unknown> =>
    api.post(`/api/admin/orders/${id}/cancel-delivery`).then(r => unwrapAdminResponse(r)),
}

export const productsApi = {
  list: (): Promise<Product[]> =>
    api.get('/api/admin/products').then(r => unwrapAdminResponse<Product[]>(r)),
  create: (data: Partial<Product>): Promise<Product> =>
    api.post('/api/admin/products', data).then(r => unwrapAdminResponse<Product>(r)),
  update: (id: number, data: Partial<Product>): Promise<Product> =>
    api.patch(`/api/admin/products/${id}`, data).then(r => unwrapAdminResponse<Product>(r)),
  delete: (id: number): Promise<void> =>
    api.delete(`/api/admin/products/${id}`).then(() => undefined),
}

export const usersApi = {
  list: (params?: { page?: number; size?: number }): Promise<PaginatedList<User>> =>
    api.get('/api/admin/users', { params }).then(r => unwrapAdminResponse<PaginatedList<User>>(r)),
  deactivate: (id: number): Promise<User> =>
    api.patch(`/api/admin/users/${id}/deactivate`).then(r => unwrapAdminResponse<User>(r)),
}
