import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to EST timezone with full date and time
 * @param dateString - ISO date string or Date object
 * @returns Formatted string like "Dec 22, 2024 at 3:30 PM EST" or empty string if invalid
 */
export function formatToEST(dateString: string | Date | null | undefined): string {
  if (!dateString) return ""

  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString

    // Check for invalid date
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateString)
      return ""
    }

    return date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }) + " EST"
  } catch (error) {
    console.warn("Error formatting date:", dateString, error)
    return ""
  }
}

/**
 * Format a date string to EST timezone with short format (no year)
 * @param dateString - ISO date string or Date object
 * @returns Formatted string like "Dec 22, 3:30 PM EST" or empty string if invalid
 */
export function formatToESTShort(dateString: string | Date | null | undefined): string {
  if (!dateString) return ""

  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString

    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateString)
      return ""
    }

    return date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }) + " EST"
  } catch (error) {
    console.warn("Error formatting date:", dateString, error)
    return ""
  }
}

/**
 * Format a date string to EST timezone - date only
 * @param dateString - ISO date string or Date object
 * @returns Formatted string like "Dec 22, 2024" or empty string if invalid
 */
export function formatDateToEST(dateString: string | Date | null | undefined): string {
  if (!dateString) return ""

  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString

    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateString)
      return ""
    }

    return date.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  } catch (error) {
    console.warn("Error formatting date:", dateString, error)
    return ""
  }
}
