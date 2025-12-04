import axios from "axios";
import type { RefreshTokenRequest, AuthResponse } from "@/types/auth";

// Storage keys
const STORAGE_KEYS = {
  TOKEN: "auth_token",
  REFRESH_TOKEN: "auth_refresh_token",
} as const;

// Promise cache to prevent concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

/**
 * Centralized token refresh utility
 * Prevents concurrent refresh attempts and handles errors gracefully
 * @returns The new access token, or null if refresh failed
 */
export async function refreshAccessToken(): Promise<string | null> {
  // If a refresh is already in progress, return the existing promise
  if (refreshPromise) {
    return refreshPromise;
  }

  // Get current tokens from storage
  const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  // If no refresh token, cannot refresh
  if (!refreshToken || !currentToken) {
    return null;
  }

  // Create refresh promise
  refreshPromise = (async (): Promise<string | null> => {
    try {
      // Prepare refresh request
      const refreshRequest: RefreshTokenRequest = {
        token: currentToken,
        refreshtoken: refreshToken,
      };

      // Call refresh token endpoint
      // Use axios directly to avoid interceptor loop
      const response = await axios.post<AuthResponse>(
        `${import.meta.env.VITE_API_BASE_URL || "https://localhost:7210"}/Auth/refresh-token`,
        refreshRequest,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const authResponse = response.data;

      // Update tokens in storage
      if (authResponse.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, authResponse.token);
      }
      if (authResponse.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken);
      }

      // Note: User data is not stored - it will be fetched from /api/profile/current when needed

      // Return new access token
      return authResponse.token || null;
    } catch (error) {
      // Don't clear tokens here - let the interceptor handle it
      // Return null to indicate failure
      return null;
    } finally {
      // Clear the promise cache after completion
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Clear the refresh promise cache (useful for testing or forced refresh)
 */
export function clearRefreshCache(): void {
  refreshPromise = null;
}

