/**
 * Authentication Types
 * Single source of truth for all authentication-related types
 */

// ==================== Request Types ====================

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  userId: string;
  code: string;
}

export interface RefreshTokenRequest {
  token: string;
  refreshtoken: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newpassword: string;
}

// ==================== Response Types ====================

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message?: string;
}

// ==================== Error Types ====================

export interface ApiError {
  code: string;
  description: string;
}

export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  errors: ApiError[];
}

// ==================== User Types ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// ==================== Hook Return Types ====================

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
  forgetPassword: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

