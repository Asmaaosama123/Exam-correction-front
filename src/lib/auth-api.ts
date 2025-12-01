import { api } from "./api";
import type {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  ForgetPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  VerifyEmailResponse,
} from "@/types/auth";

// Auth API endpoints
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/Auth", data);
    return response.data;
  },

  /**
   * Verify email with code
   */
  verifyEmail: async (data: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
    const response = await api.post<VerifyEmailResponse>("/Auth/confirm-email", data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/Auth/refresh-token", data);
    return response.data;
  },

  /**
   * Request password reset
   */
  forgetPassword: async (data: ForgetPasswordRequest): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post<{ success: boolean; message?: string }>("/Auth/forget-password", data);
    return response.data;
  },

  /**
   * Reset password with code
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post<{ success: boolean; message?: string }>("/Auth/reset-password", data);
    return response.data;
  },
};

