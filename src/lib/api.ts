import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
} from "axios";
import type { ApiErrorResponse } from "@/types/auth";

// API Base URL - should be moved to environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7210";

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");
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
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: "خطأ في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.",
        status: 0,
      });
    }

    // Handle API errors
    const errorResponse = error.response.data;

    // Return structured error
    return Promise.reject({
      ...errorResponse,
      status: error.response.status,
    });
  }
);

// Type guard to check if error has ApiErrorResponse structure
function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "title" in error
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
        return apiError.errors[0].description;
      }
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
      const camelCaseFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
      if (apiError.errors[camelCaseFieldName]) {
        return apiError.errors[camelCaseFieldName];
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
