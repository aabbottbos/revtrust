/**
 * Hook for making authenticated API requests from client components
 */

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      try {
        console.log("🔐 Fetching:", url);

        // Get the Clerk session token
        const token = await getToken();
        console.log("🎫 Token received:", token ? "✅ Yes" : "❌ No");

        // Add authorization header
        const headers = new Headers(options.headers);

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        // Make the request with the token
        console.log("📡 Making request to:", url);
        const response = await fetch(url, {
          ...options,
          headers,
        });

        console.log("📥 Response status:", response.status, response.statusText);
        return response;
      } catch (error) {
        console.error("❌ Fetch error:", error);
        console.error("URL:", url);
        console.error("Error type:", error instanceof TypeError ? "TypeError" : typeof error);
        throw error;
      }
    },
    [getToken]
  );

  return authenticatedFetch;
}
