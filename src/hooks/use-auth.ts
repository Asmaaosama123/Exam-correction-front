import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/lib/auth-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import type {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  ForgetPasswordRequest,
  ResetPasswordRequest,
} from "@/types/auth";

// Storage keys
const STORAGE_KEYS = {
  TOKEN: "auth_token",
  REFRESH_TOKEN: "auth_refresh_token",
  USER: "auth_user",
} as const;

// Helper functions for token management
const tokenStorage = {
  setToken: (token: string) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  removeToken: () => localStorage.removeItem(STORAGE_KEYS.TOKEN),

  setRefreshToken: (token: string) =>
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  removeRefreshToken: () => localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),

  setUser: (user: unknown) =>
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem(STORAGE_KEYS.USER),

  clear: () => {
    tokenStorage.removeToken();
    tokenStorage.removeRefreshToken();
    tokenStorage.removeUser();
  },
};

export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      if (response.token) {
        tokenStorage.setToken(response.token);
      }
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken);
      }
      if (response.id) {
        tokenStorage.setUser({
          id: response.id,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
        });
      }

      // queryClient.invalidateQueries({ queryKey: ["auth"] });

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
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      // Store tokens
      if (response.token) {
        tokenStorage.setToken(response.token);
      }
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken);
      }
      if (response.id) {
        tokenStorage.setUser({
          id: response.id,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["auth"] });

      toast.success("تم تسجيل الدخول بنجاح", {
        description: `مرحباً ${response.firstName || ""}`,
      });

      // Check if there's a return URL from AuthGuard
      const returnUrl = sessionStorage.getItem("returnUrl") || "/dashboard";

      if (returnUrl && returnUrl !== "/login") {
        sessionStorage.removeItem("returnUrl");
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
 * Hook for token refresh
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => authApi.refreshToken(data),
    onSuccess: (response) => {
      if (response.token) {
        tokenStorage.setToken(response.token);
      }
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken);
      }

      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: () => {
      // If refresh fails, logout user
      tokenStorage.clear();
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

/**
 * Hook to get current user
 */
export function useAuth() {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: () => {
      const user = tokenStorage.getUser();
      const token = tokenStorage.getToken();

      if (!user || !token) {
        return null;
      }

      return {
        ...user,
        isAuthenticated: true,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    tokenStorage.clear();
    queryClient.invalidateQueries({ queryKey: ["auth"] });
    queryClient.clear();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/");
  };
}

// Export token storage for use in other parts of the app
export { tokenStorage };
