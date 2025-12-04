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
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/Auth", data);
    return response.data;
  },

  verifyEmail: async (
    data: VerifyEmailRequest
  ): Promise<VerifyEmailResponse> => {
    const response = await api.post<VerifyEmailResponse>(
      "/Auth/confirm-email",
      data
    );
    return response.data;
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/Auth/refresh-token", data);
    return response.data;
  },

  forgetPassword: async (
    data: ForgetPasswordRequest
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post<{ success: boolean; message?: string }>(
      "/Auth/forget-password",
      data
    );
    return response.data;
  },

  resetPassword: async (
    data: ResetPasswordRequest
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post<{ success: boolean; message?: string }>(
      "/Auth/reset-password",
      data
    );
    return response.data;
  },

  /**
   * Get current user info (validate session)
   */
  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>("/api/profile/current");
    return response.data;
  },
};
