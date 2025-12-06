/**
 * API Client with Clerk authentication
 * Automatically includes Clerk session token in all requests
 */

import { auth } from "@clerk/nextjs/server";

/**
 * Make an authenticated API request (server-side)
 * Use this in server components and API routes
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { getToken } = await auth();
  const token = await getToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Client-side authenticated fetch hook
 * Use this with useAuth() in client components
 */
export function createAuthenticatedFetch(getToken: () => Promise<string | null>) {
  return async function (url: string, options: RequestInit = {}): Promise<Response> {
    const token = await getToken();

    const headers = new Headers(options.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };
}
