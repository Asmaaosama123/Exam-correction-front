import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/lib/auth-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import { joinFullName } from "@/lib/name-utils";
import { authManager } from "@/lib/auth-manager";
import type {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ForgetPasswordRequest,
  ResetPasswordRequest,
} from "@/types/auth";

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

      // Step 2: Save tokens using authManager
      if (loginResponse.token && loginResponse.refreshToken) {
        authManager.setTokens(loginResponse.token, loginResponse.refreshToken);
      } else if (loginResponse.token) {
        tokenStorage.setToken(loginResponse.token);
      } else if (loginResponse.refreshToken) {
        tokenStorage.setRefreshToken(loginResponse.refreshToken);
      }

      // Step 3: Fetch /api/profile/current to get user data
      const userResponse = await authApi.getMe();

      return { loginResponse, userResponse };
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
      // Check both "returnUrl" (from AuthGuard) and "returnTo" (from interceptor) for backward compatibility
      const returnUrl =
        sessionStorage.getItem("returnUrl") ||
        sessionStorage.getItem("returnTo") ||
        "/dashboard";

      // Clean up both keys
      sessionStorage.removeItem("returnUrl");
      sessionStorage.removeItem("returnTo");

      // Navigate immediately - query data is already set, so AuthGuard will see the user
      if (returnUrl && returnUrl !== "/login" && returnUrl !== "/register") {
        navigate(returnUrl, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
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
 * Hook for email verification
 */
export function useVerifyEmail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => authApi.verifyEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });

      toast.success("تم التحقق من البريد الإلكتروني بنجاح", {
        description: "يمكنك الآن تسجيل الدخول",
      });

      navigate("/login");
    },
    onError: (error) => {
      toast.error("فشل التحقق من البريد الإلكتروني", {
        description: getErrorMessage(error),
      });
    },
  });
}

/**
 * Hook for password reset request
 */
export function useForgetPassword() {
  return useMutation({
    mutationFn: (data: ForgetPasswordRequest) => authApi.forgetPassword(data),
    onSuccess: () => {
      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور", {
        description: "يرجى التحقق من بريدك الإلكتروني",
      });
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل إرسال رابط إعادة التعيين", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Hook for password reset
 */
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: () => {
      toast.success("تم إعادة تعيين كلمة المرور بنجاح", {
        description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة",
      });

      navigate("/login");
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل إعادة تعيين كلمة المرور", {
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
      } catch {
        // If /api/profile/current fails, check if we have cached data
        // This prevents clearing auth state if there's a temporary network issue
        const cachedData = queryClient.getQueryData<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          isAuthenticated: boolean;
        }>(["auth", "user"]);

        // Only clear tokens if we don't have cached data (real auth failure)
        // If we have cached data, it might be a temporary network issue
        if (!cachedData) {
          authManager.clearTokens();
          return null;
        }

        // Return cached data if available (might be temporary network issue)
        return cachedData;
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
