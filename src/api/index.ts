// Re-export firestore API
export { productsApi, cartApi, ordersApi, usersApi } from './firestore-api'

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

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaValidationError'
  }
}

/** Photo URL helper */
export function photoUrl(fileId: string): string {
  return fileId
}

/** Extract user-facing message from API errors. */
export function apiErrorMessage(err: unknown, fallback = 'Error'): string {
  if (err instanceof Error) return err.message
  return fallback
}
