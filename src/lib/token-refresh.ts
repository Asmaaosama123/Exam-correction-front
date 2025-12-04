/**
 * Token Refresh Utility
 * 
 * @deprecated Use authManager.refreshAccessToken() instead
 * This file is kept for backward compatibility
 */

import { authManager } from "./auth-manager";

/**
 * Refresh access token
 * @deprecated Use authManager.refreshAccessToken() instead
 */
export async function refreshAccessToken(): Promise<string | null> {
  return authManager.refreshAccessToken();
}

/**
 * Clear refresh cache
 * @deprecated No longer needed with authManager
 */
export function clearRefreshCache(): void {
  // No-op - authManager handles this internally
}

