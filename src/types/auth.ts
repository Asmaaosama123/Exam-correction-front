export interface RegisterRequest {
  phoneNumber?: string;
  password: string;
  firstName: string;
  lastName: string;
  isEmail: boolean;
  Email?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  isEmail: boolean;
}

export interface RefreshTokenRequest {
  token: string;
  refreshtoken: string;
}

// ==================== Response Types ====================

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  id?: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

// ==================== Error Types ====================

export interface ApiError {
  code: string;
  description: string;
}

// Validation error format from ASP.NET Core
export interface ValidationErrorResponse {
  type: string;
  title: string;
  status: number;
  errors: Record<string, string[]>; // Field name -> array of error messages
  traceId?: string;
}

// Legacy error format (array of errors)
export interface LegacyApiErrorResponse {
  type: string;
  title: string;
  status: number;
  errors: ApiError[];
}

// Union type for API error responses
export type ApiErrorResponse = ValidationErrorResponse | LegacyApiErrorResponse;

// ==================== User Types ====================

export interface User {
  id: string;
  phoneNumber: string;
  email?: string | null;
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
  refreshAuth: () => Promise<void>;
}
