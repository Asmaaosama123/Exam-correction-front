import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { authApi } from "@/lib/auth-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import { joinFullName } from "@/lib/name-utils";
import { authManager } from "@/lib/auth-manager";
import type { RegisterRequest, LoginRequest } from "@/types/auth";

// Token storage helper - now uses authManager
// This is kept for backward compatibility with existing code
const tokenStorage = {
  setToken: (token: string) => {
    const refreshToken = authManager.getRefreshToken() || "";
    authManager.setTokens(token, refreshToken);
  },
  getToken: () => authManager.getAccessToken(),
  removeToken: () => {
    authManager.clearTokens();
  },

  setRefreshToken: (token: string) => {
    const accessToken = authManager.getAccessToken() || "";
    authManager.setTokens(accessToken, token);
  },
  getRefreshToken: () => authManager.getRefreshToken(),
  removeRefreshToken: () => {
    authManager.clearTokens();
  },

  clear: () => authManager.clearTokens(),
};

export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      // Registration doesn't automatically log in - user needs to verify email first
      toast.success("تم إنشاء الحساب بنجاح");
      navigate("/login");
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل إنشاء الحساب", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      // Step 1: Call /Auth endpoint
      const loginResponse = await authApi.login(data);

      // Step 2: Validate and save tokens using authManager
      // Both tokens are required for proper authentication
      if (!loginResponse.token || !loginResponse.refreshToken) {
        throw new Error(
          "Invalid login response: both access token and refresh token are required"
        );
      }

      authManager.setTokens(loginResponse.token, loginResponse.refreshToken);

      // Step 3: Fetch /api/profile/current to get user data
      // If this fails, clear tokens to prevent inconsistent state
      try {
        const userResponse = await authApi.getMe();
        return { loginResponse, userResponse };
      } catch (error) {
        // If getMe fails, clear tokens and rethrow to prevent partial login state
        authManager.clearTokens();
        throw error;
      }
    },
    onSuccess: ({ userResponse }) => {
      // Set user data directly in query cache to prevent race condition
      // This ensures AuthGuard sees the user immediately after navigation
      const userData = {
        id: userResponse.id,
        email: userResponse.email || "",
        firstName: userResponse.firstName || "",
        lastName: userResponse.lastName || "",
        isAuthenticated: true,
      };

      queryClient.setQueryData(["auth", "user"], userData);

      const fullName = joinFullName(
        userResponse.firstName,
        userResponse.lastName
      );
      toast.success("تم تسجيل الدخول بنجاح", {
        description: `مرحباً ${fullName || userResponse.email || ""}`,
      });

      // Step 4: Navigate to dashboard or return to last location
      const returnUrl = "/dashboard";
      navigate(returnUrl, { replace: true });
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل تسجيل الدخول", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Hook to manually refresh access token
 * Note: Automatic refresh is handled by axios interceptor via authManager
 * This hook is available for manual refresh if needed
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Use authManager for refresh
      const newToken = await authManager.refreshAccessToken();
      if (!newToken) {
        throw new Error("فشل تحديث الجلسة");
      }
      return { token: newToken };
    },
    onSuccess: () => {
      // Invalidate auth queries to refresh user data from /api/profile/current
      queryClient.invalidateQueries({ queryKey: ["auth"] });

      toast.success("تم تحديث الجلسة بنجاح");
    },
    onError: (error) => {
      // If refresh fails, clear tokens and logout user
      authManager.logout(false); // Don't redirect, let component handle it
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.clear();

      // Show error toast
      toast.error("فشل تحديث الجلسة", {
        description:
          getErrorMessage(error) ||
          "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى",
      });
    },
  });
}

/**
 * Hook to get current user - always fetches from /api/profile/current
 * This is called on app open/reload to check logged-in state
 */
export function useAuth() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const token = authManager.getAccessToken();

      // If no token, user is not authenticated
      if (!token) {
        return null;
      }

      // Fetch user data from /api/profile/current
      try {
        const response = await authApi.getMe();

        if (!response.id) {
          return null;
        }

        return {
          id: response.id,
          email: response.email || "",
          firstName: response.firstName || "",
          lastName: response.lastName || "",
          isAuthenticated: true,
        };
      } catch (error) {
        // Check if it's an authentication error (401/403) vs network error
        const isAuthError =
          axios.isAxiosError(error) &&
          (error.response?.status === 401 || error.response?.status === 403);

        if (isAuthError) {
          // Authentication error - clear tokens and return null
          authManager.clearTokens();
          return null;
        }

        // Network error or other error - check if we have cached data
        // This prevents clearing auth state if there's a temporary network issue
        const cachedData = queryClient.getQueryData<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          isAuthenticated: boolean;
        }>(["auth", "user"]);

        // Only return cached data if available (might be temporary network issue)
        // If no cached data, return null to indicate unauthenticated state
        return cachedData || null;
      }
    },
    retry: false, // Don't retry on failure - let interceptor handle 401
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount (app open/reload)
    // Use cached data as initial data to prevent flicker
    placeholderData: (previousData) => previousData,
  });
}

// Note: useValidateSession is no longer needed - useAuth now always uses /api/profile/current

/**
 * Hook for logout
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    authManager.logout(false); // Don't redirect, we'll handle it manually
    queryClient.invalidateQueries({ queryKey: ["auth"] });
    queryClient.clear();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/");
  };
}

// Export token storage for backward compatibility
export { tokenStorage };
