import { api } from "./api";
import type {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
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

  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/Auth/refresh-token", data);
    return response.data;
  },

  /**
   * Get current user info (validate session)
   */
  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>("/Profile/current");
    return response.data;
  },
};
