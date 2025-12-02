export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = "APIError"
  }

  getUserMessage(): string {
    switch (this.statusCode) {
      case 400:
        return this.message || "Invalid request. Please check your input."
      case 401:
        return "Your session has expired. Please sign in again."
      case 403:
        return "You don't have permission to access this resource."
      case 404:
        return "The requested resource was not found."
      case 429:
        return "Too many requests. Please wait a moment and try again."
      case 500:
        return "Server error. Our team has been notified."
      case 503:
        return "Service temporarily unavailable. Please try again in a few moments."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }

  isRetryable(): boolean {
    return [429, 500, 503].includes(this.statusCode)
  }
}

export async function handleAPIResponse(response: Response) {
  if (response.ok) {
    return response.json()
  }

  let errorData: any
  try {
    errorData = await response.json()
  } catch {
    errorData = {}
  }

  const message = errorData.detail || errorData.message || response.statusText
  throw new APIError(message, response.status, errorData)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.getUserMessage()
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred"
}
