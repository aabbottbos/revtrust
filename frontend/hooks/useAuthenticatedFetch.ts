/**
 * Hook for making authenticated API requests from client components
 */

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      // Get the Clerk session token
      const token = await getToken();

      // Add authorization header
      const headers = new Headers(options.headers);

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      // Make the request with the token
      return fetch(url, {
        ...options,
        headers,
      });
    },
    [getToken]
  );

  return authenticatedFetch;
}
