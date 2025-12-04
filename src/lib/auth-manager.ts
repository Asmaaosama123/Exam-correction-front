/**
 * Auth Manager - Centralized authentication state and token management
 * Handles token refresh, storage, and logout logic
 */

import axios from "axios";
import type { RefreshTokenRequest, AuthResponse } from "@/types/auth";

// Storage keys
const STORAGE_KEYS = {
  TOKEN: "auth_token",
  REFRESH_TOKEN: "auth_refresh_token",
} as const;

// Request queue for handling concurrent requests during token refresh
type QueuedRequest = {
  resolve: (value: string | null) => void;
  reject: (error: unknown) => void;
};

class AuthManager {
  private refreshPromise: Promise<string | null> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private isRefreshing = false;

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if user has valid tokens
   */
  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }

  /**
   * Set tokens in storage
   */
  setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Refresh access token using refresh token
   * Uses a promise queue to prevent concurrent refresh attempts
   * @returns The new access token, or null if refresh failed
   */
  async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, queue this request
    if (this.isRefreshing && this.refreshPromise) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject });
      });
    }

    // Get tokens
    const currentToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    // If no tokens, cannot refresh
    if (!refreshToken || !currentToken) {
      return null;
    }

    // Set refreshing flag
    this.isRefreshing = true;

    // Create refresh promise
    this.refreshPromise = (async (): Promise<string | null> => {
      try {
        // Prepare refresh request
        const refreshRequest: RefreshTokenRequest = {
          token: currentToken,
          refreshtoken: refreshToken,
        };

        // Call refresh token endpoint
        // Use axios directly to avoid interceptor loop
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "https://localhost:7210";

        const response = await axios.post<AuthResponse>(
          `${API_BASE_URL}/Auth/refresh-token`,
          refreshRequest,
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 30000,
            // Skip interceptors for refresh token call
            validateStatus: (status) => status < 500, // Don't throw on 401/403
          }
        );

        // Check if refresh was successful
        if (response.status === 200 && response.data.token) {
          const authResponse = response.data;

          // Update tokens in storage
          if (authResponse.token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, authResponse.token);
          }
          if (authResponse.refreshToken) {
            localStorage.setItem(
              STORAGE_KEYS.REFRESH_TOKEN,
              authResponse.refreshToken
            );
          }

          // Resolve all queued requests
          const newToken = authResponse.token || null;
          this.resolveQueue(newToken);

          return newToken;
        } else {
          // Refresh failed - tokens are invalid
          this.clearTokens();
          this.rejectQueue(new Error("Token refresh failed"));
          return null;
        }
      } catch (error) {
        // Refresh failed with an error
        this.clearTokens();
        this.rejectQueue(error);
        return null;
      } finally {
        // Reset refreshing state
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Resolve all queued requests with the new token
   */
  private resolveQueue(token: string | null): void {
    this.requestQueue.forEach(({ resolve }) => resolve(token));
    this.requestQueue = [];
  }

  /**
   * Reject all queued requests
   */
  private rejectQueue(error: unknown): void {
    this.requestQueue.forEach(({ reject }) => reject(error));
    this.requestQueue = [];
  }

  /**
   * Handle logout - clear tokens and redirect to login
   */
  logout(redirectToLogin = true): void {
    this.clearTokens();
    
    if (redirectToLogin) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        sessionStorage.setItem("returnUrl", currentPath);
        sessionStorage.setItem("showUnauthorizedToast", "true");
      }
      window.location.href = "/login";
    }
  }

  /**
   * Check if a request URL should skip token refresh
   */
  shouldSkipRefresh(url: string | undefined, method: string | undefined): boolean {
    if (!url) return false;

    const normalizedUrl = url.toLowerCase();
    const normalizedMethod = method?.toLowerCase() || "";

    // Skip refresh for login endpoint
    const isLoginEndpoint =
      (normalizedUrl.endsWith("/auth") || normalizedUrl.endsWith("/auth/")) &&
      normalizedMethod === "post";

    // Skip refresh for refresh-token endpoint itself
    const isRefreshEndpoint =
      normalizedUrl.includes("/auth/refresh-token") ||
      normalizedUrl.includes("/auth/refresh-token/");

    return isLoginEndpoint || isRefreshEndpoint;
  }
}

// Export singleton instance
export const authManager = new AuthManager();

