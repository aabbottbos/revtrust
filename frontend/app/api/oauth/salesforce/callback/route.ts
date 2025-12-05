import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // If there's an error from Salesforce, redirect to error page
  if (error) {
    return NextResponse.redirect(
      new URL(`/crm/error?message=${errorDescription || error}`, request.url)
    )
  }

  // If no code, something went wrong
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/crm/error?message=Missing authorization code or state', request.url)
    )
  }

  try {
    // Forward the request to the backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/salesforce/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`

    const response = await fetch(backendUrl, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    })

    // The backend will return a redirect response
    if (response.status === 307 || response.status === 302) {
      const location = response.headers.get('location')
      if (location) {
        // Extract the path from the location header
        const url = new URL(location)
        return NextResponse.redirect(new URL(url.pathname + url.search, request.url))
      }
    }

    // If successful, redirect to success page
    if (response.ok) {
      return NextResponse.redirect(new URL('/crm?success=salesforce', request.url))
    }

    // If error, redirect to error page
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
    return NextResponse.redirect(
      new URL(`/crm/error?message=${encodeURIComponent(errorData.message || 'OAuth failed')}`, request.url)
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/crm/error?message=${encodeURIComponent('Failed to complete OAuth flow')}`, request.url)
    )
  }
}
