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

// Helper function to extract error messages
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const apiError = error.response?.data;

    if (apiError?.errors && apiError.errors.length > 0) {
      // Return first error description
      return apiError.errors[0].description;
    }

    if (apiError?.title) {
      return apiError.title;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
};

// Helper function to get all error messages
export const getAllErrorMessages = (error: unknown): string[] => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const apiError = error.response?.data;

    if (apiError?.errors && apiError.errors.length > 0) {
      return apiError.errors.map((err) => err.description);
    }
  }

  return [getErrorMessage(error)];
};
