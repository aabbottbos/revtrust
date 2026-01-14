/**
 * Server-side admin verification utilities
 * These functions run on the server and provide secure admin access control
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

/**
 * Verify if the current user has admin access
 * This runs on the server and makes a secure backend call
 *
 * @returns The admin verification result
 * @throws Redirects to sign-in if not authenticated
 * @throws Redirects to dashboard if not admin
 */
export async function verifyAdminAccess(): Promise<{
  userId: string
  isAdmin: boolean
}> {
  // Get the current authenticated user from Clerk
  const { userId, getToken } = await auth()

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in?redirect_url=/admin')
  }

  try {
    // Get the session token
    const token = await getToken()

    // Call backend to verify admin status
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    const response = await fetch(
      `${apiUrl}/api/admin/verify`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // Always fetch fresh admin status
      }
    )

    if (response.status === 401) {
      // Token expired or invalid
      redirect('/sign-in?redirect_url=/admin')
    }

    const data = await response.json()

    return {
      userId,
      isAdmin: data.isAdmin,
    }
  } catch (error) {
    console.error('Failed to verify admin access:', error)
    // On error, assume not admin for security
    return {
      userId,
      isAdmin: false,
    }
  }
}

/**
 * Require admin access - redirects if not admin
 * Use this in server components to protect admin pages
 *
 * @returns The userId of the authenticated admin
 * @throws Redirects to dashboard if not admin
 * @throws Redirects to sign-in if not authenticated
 */
export async function requireAdmin(): Promise<string> {
  const { userId, isAdmin } = await verifyAdminAccess()

  if (!isAdmin) {
    // User is authenticated but not admin - redirect to dashboard
    redirect('/dashboard')
  }

  return userId
}

/**
 * Check if user is admin without redirecting
 * Useful for conditional rendering
 *
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const { isAdmin } = await verifyAdminAccess()
  return isAdmin
}
