/**
 * Controlled retry with exponential backoff.
 * Used for POST mutations (max 1 retry) — never for GET or photo loads.
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxRetries: 0,
  baseDelayMs: 300,
  maxDelayMs: 5_000,
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function exponentialBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const delay = baseDelayMs * 2 ** attempt
  return Math.min(delay, maxDelayMs)
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    baseDelayMs = DEFAULT_OPTIONS.baseDelayMs,
    maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
    shouldRetry = () => true,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt >= maxRetries || !shouldRetry(error, attempt)) {
        throw error
      }
      const delay = exponentialBackoffDelay(attempt, baseDelayMs, maxDelayMs)
      await sleep(delay)
    }
  }

  throw lastError
}

/** POST mutation policy: at most one retry; skip on 4xx client errors. */
export function mutationRetryOptions(idempotencyKey?: string): RetryOptions {
  return {
    maxRetries: idempotencyKey ? 1 : 0,
    baseDelayMs: 400,
    maxDelayMs: 2_000,
    shouldRetry: (error) => {
      const status = (error as { status?: number }).status
      if (status !== undefined && status >= 400 && status < 500) return false
      return true
    },
  }
}
