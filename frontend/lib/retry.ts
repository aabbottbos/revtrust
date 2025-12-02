import { APIError } from "./api-errors"

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
  } = options

  let lastError: Error | undefined
  let delay = delayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if it's not a retryable error
      if (error instanceof APIError && !error.isRetryable()) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= backoffMultiplier
    }
  }

  throw lastError || new Error("Retry failed")
}
