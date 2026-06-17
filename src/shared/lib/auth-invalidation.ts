import { queryClient } from '@/shared/lib/query-client'
import { useAuthStore, useCartStore } from '@/app/store'

type AuthInvalidationListener = () => void

const listeners = new Set<AuthInvalidationListener>()

let invalidating = false

export function registerAuthInvalidationListener(
  listener: AuthInvalidationListener,
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Clear session, wipe query cache, and notify AuthProvider to re-gate the app. */
export function invalidateAuthSession(): void {
  if (invalidating) return
  invalidating = true

  useAuthStore.getState().clear()
  useCartStore.getState().clearCart()
  queryClient.clear()
  listeners.forEach((listener) => listener())

  queueMicrotask(() => {
    invalidating = false
  })
}
