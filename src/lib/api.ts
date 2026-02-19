import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
} from "axios";
import type { ApiErrorResponse } from "@/types/auth";
import { authManager } from "./auth-manager";

const API_BASE_URL = "/api";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: "خطأ في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.",
        status: 0,
      });
    }

    // Handle 401 Unauthorized - Attempt token refresh before logout
    if (error.response.status === 401) {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      const requestUrl = originalRequest.url;
      const requestMethod = originalRequest.method;

      // Skip refresh for auth endpoints (login, refresh-token) to prevent loops
      if (authManager.shouldSkipRefresh(requestUrl, requestMethod)) {
        return Promise.reject({
          ...error.response.data,
          status: 401,
        });
      }

      // If already retried, don't retry again
      if (originalRequest._retry) {
        // Already attempted refresh, tokens are invalid
        authManager.logout();
        return Promise.reject({
          ...error.response.data,
          status: 401,
        });
      }

      // Check if we have tokens to attempt refresh
      if (!authManager.hasTokens()) {
        // No tokens available, redirect to login
        authManager.logout();
        return Promise.reject({
          ...error.response.data,
          status: 401,
        });
      }

      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        // This will queue concurrent requests and only refresh once
        const newToken = await authManager.refreshAccessToken();

        if (newToken) {
          // Refresh successful - update authorization header and retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          // Retry the original request with new token
          return api(originalRequest);
        } else {
          // Refresh failed - tokens are invalid or expired
          authManager.logout();
          return Promise.reject({
            ...error.response.data,
            status: 401,
          });
        }
      } catch {
        // Refresh failed with an error - tokens are invalid
        authManager.logout();
        return Promise.reject({
          ...error.response.data,
          status: 401,
        });
      }
    }

    // Handle other API errors
    const errorResponse = error.response.data;

    // Return structured error
    return Promise.reject({
      ...errorResponse,
      status: error.response.status,
    });
  }
);

// Type guard to check if error has ApiErrorResponse structure
function isApiErrorResponse(error: unknown): error is any {
  return (
    typeof error === "object" &&
    error !== null &&
    (("status" in error && "title" in error) || ("Code" in error && "Description" in error) || ("code" in error && "description" in error))
  );
}

// Type guard to check if error is ValidationErrorResponse
function isValidationErrorResponse(
  error: ApiErrorResponse
): error is import("@/types/auth").ValidationErrorResponse {
  return (
    error.errors !== undefined &&
    !Array.isArray(error.errors) &&
    typeof error.errors === "object"
  );
}

// Type guard to check if error is LegacyApiErrorResponse
function isLegacyErrorResponse(
  error: ApiErrorResponse
): error is import("@/types/auth").LegacyApiErrorResponse {
  return (
    error.errors !== undefined &&
    Array.isArray(error.errors) &&
    error.errors.length > 0
  );
}

// Helper function to extract ApiErrorResponse from error
function extractApiError(error: unknown): ApiErrorResponse | null {
  // Check if it's an AxiosError
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data || null;
  }

  // Check if it's a custom error with response.data structure (e.g., from blob downloads)
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as unknown as { response: unknown }).response === "object" &&
    (error as unknown as { response: unknown }).response !== null &&
    "data" in (error as unknown as { response: { data: unknown } }).response
  ) {
    const errorData = (error as unknown as { response: { data: unknown } })
      .response.data;
    if (isApiErrorResponse(errorData)) {
      return errorData;
    }
  }

  // Check if it's already an ApiErrorResponse (from interceptor)
  if (isApiErrorResponse(error)) {
    return error;
  }

  return null;
}

// Helper function to extract error messages
export const getErrorMessage = (error: unknown): string => {
  const apiError = extractApiError(error);

  if (apiError) {
    // Handle validation errors (new format)
    if (isValidationErrorResponse(apiError)) {
      const errorMessages = Object.values(apiError.errors).flat();
      if (errorMessages.length > 0) {
        return errorMessages[0];
      }
    }

    // Handle legacy error format
    if (isLegacyErrorResponse(apiError)) {
      if (apiError.errors.length > 0) {
        const firstErr = apiError.errors[0];
        return (firstErr as any).description || (firstErr as any).Description || (firstErr as any).title || "";
      }
    }

    // Handle single Error record (PascalCase or camelCase)
    if ((apiError as any).Description || (apiError as any).description) {
      return (apiError as any).Description || (apiError as any).description;
    }

    // Fallback to title
    if (apiError.title) {
      return apiError.title;
    }
  }

  // Handle AxiosError message
  if (axios.isAxiosError(error) && error.message) {
    return error.message;
  }

  // Handle generic Error
  if (error instanceof Error) {
    return error.message;
  }

  return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
};

// Helper function to get all error messages
export const getAllErrorMessages = (error: unknown): string[] => {
  const apiError = extractApiError(error);

  if (apiError) {
    // Handle validation errors (new format)
    if (isValidationErrorResponse(apiError)) {
      return Object.values(apiError.errors).flat();
    }

    // Handle legacy error format
    if (isLegacyErrorResponse(apiError)) {
      return apiError.errors.map((err) => err.description);
    }
  }

  return [getErrorMessage(error)];
};

// Helper function to map legacy error codes to field names
function mapErrorCodeToField(errorCode: string): string | null {
  const code = errorCode.toLowerCase();

  // Map common error codes to field names
  if (code.includes("email") || code.includes("duplicateemail")) {
    return "email";
  }
  if (code.includes("password")) {
    return "password";
  }
  if (code.includes("firstname") || code.includes("first_name")) {
    return "firstName";
  }
  if (code.includes("lastname") || code.includes("last_name")) {
    return "lastName";
  }
  if (code.includes("secretkey") || code.includes("secret_key")) {
    return "secretKey";
  }
  if (code.includes("mobilenumber") || code.includes("mobile_number")) {
    return "mobileNumber";
  }
  if (code.includes("phonenumber") || code.includes("phone_number")) {
    return "phoneNumber";
  }
  if (code.includes("nationalid") || code.includes("national_id")) {
    return "nationalId";
  }
  if (code.includes("classid") || code.includes("class_id")) {
    return "classId";
  }
  if (code.includes("file")) {
    return "file";
  }

  return null;
}

// Helper function to get field-specific error messages
export const getFieldErrors = (error: unknown, fieldName: string): string[] => {
  const apiError = extractApiError(error);

  if (apiError) {
    // Handle validation errors (new format)
    if (isValidationErrorResponse(apiError)) {
      // Try exact field name match first
      if (apiError.errors[fieldName]) {
        return apiError.errors[fieldName];
      }

      // Try camelCase conversion (e.g., "SecretKey" -> "secretKey")
      const camelCaseFieldName =
        fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
      if (apiError.errors[camelCaseFieldName]) {
        return apiError.errors[camelCaseFieldName];
      }

      // Try PascalCase conversion (e.g., "lastName" -> "LastName")
      const pascalCaseFieldName =
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      if (apiError.errors[pascalCaseFieldName]) {
        return apiError.errors[pascalCaseFieldName];
      }

      // Try case-insensitive match
      const fieldKey = Object.keys(apiError.errors).find(
        (key) => key.toLowerCase() === fieldName.toLowerCase()
      );
      if (fieldKey) {
        return apiError.errors[fieldKey];
      }
    }

    // Handle legacy error format - map error codes to fields
    if (isLegacyErrorResponse(apiError)) {
      const fieldErrors = apiError.errors
        .filter((err) => {
          const mappedField = mapErrorCodeToField(err.code);
          return mappedField === fieldName;
        })
        .map((err) => err.description);

      if (fieldErrors.length > 0) {
        return fieldErrors;
      }
    }
  }

  return [];
};

// Helper function to get first error for a specific field
export const getFieldError = (error: unknown, fieldName: string): string => {
  const errors = getFieldErrors(error, fieldName);
  return errors.length > 0 ? errors[0] : "";
};

// Helper function to check if error has field errors
export const hasFieldError = (error: unknown, fieldName: string): boolean => {
  return getFieldErrors(error, fieldName).length > 0;
};

// Helper function to normalize field name (convert PascalCase to camelCase)
function normalizeFieldName(fieldName: string): string {
  // Convert PascalCase to camelCase (e.g., "SecretKey" -> "secretKey")
  return fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
}

// Helper function to get all field errors as an object
export const getAllFieldErrors = (error: unknown): Record<string, string[]> => {
  const apiError = extractApiError(error);

  if (apiError) {
    // Handle validation errors (new format)
    if (isValidationErrorResponse(apiError)) {
      // Normalize field names to camelCase
      const normalizedErrors: Record<string, string[]> = {};
      Object.keys(apiError.errors).forEach((key) => {
        const normalizedKey = normalizeFieldName(key);
        normalizedErrors[normalizedKey] = apiError.errors[key];
      });
      return normalizedErrors;
    }

    // Handle legacy error format - map error codes to fields
    if (isLegacyErrorResponse(apiError)) {
      const fieldErrorsMap: Record<string, string[]> = {};

      apiError.errors.forEach((err) => {
        const mappedField = mapErrorCodeToField(err.code);
        if (mappedField) {
          if (!fieldErrorsMap[mappedField]) {
            fieldErrorsMap[mappedField] = [];
          }
          fieldErrorsMap[mappedField].push(err.description);
        }
      });

      return fieldErrorsMap;
    }
  }

  return {};
};
