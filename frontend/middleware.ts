import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',  // Clerk webhooks
])

// Define admin routes that require admin role verification
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Handle admin routes with custom logic first
  if (isAdminRoute(request)) {
    const { userId, getToken } = await auth()

    // If not authenticated, redirect to sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Verify admin access with backend
    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      const response = await fetch(`${apiUrl}/api/admin/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        // If verification fails, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      const data = await response.json()

      if (!data.isAdmin) {
        // User is authenticated but not admin - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // User is admin, allow access
      return NextResponse.next()
    } catch (error) {
      console.error('Admin verification failed:', error)
      // On error, redirect to dashboard for security
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect all other routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
