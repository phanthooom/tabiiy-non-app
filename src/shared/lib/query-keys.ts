/** Canonical React Query keys — keep all fetch/mutation invalidation aligned here. */

export const queryKeys = {
  orders: (page: number) => ['orders', page] as const,
  order: (id: string | number) => ['order', id] as const,
  cart: () => ['cart'] as const,
  products: () => ['products'] as const,
  product: (id: number) => ['product', id] as const,
}

export const STALE_TIME = {
  orders: 60_000,       // 60s — order list/detail
  cart: 30_000,         // 30s
  products: 300_000,    // 5 min — catalog changes infrequently
} as const
