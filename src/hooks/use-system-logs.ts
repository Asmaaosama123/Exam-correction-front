import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ErrorSummary {
  errorMessage: string;
  count: number;
  lastOccurrence: string;
}

export interface ErrorDetail {
  id: number;
  errorMessage: string;
  errorDetails: string;
  errorSource: string;
  createdAt: string;
  isResolved: boolean;
  ownerId: string | null;
  userFullName: string;
}

export function useGetErrorSummary() {
  return useQuery<ErrorSummary[]>({
    queryKey: ["system-errors-summary"],
    queryFn: async () => {
      const response = await api.get("/api/AdminLogs/summary");
      return response.data;
    },
  });
}

export function useGetErrorDetails(errorMessage: string) {
  return useQuery<ErrorDetail[]>({
    queryKey: ["system-errors-details", errorMessage],
    queryFn: async () => {
      const response = await api.get(`/api/AdminLogs/details?errorMessage=${encodeURIComponent(errorMessage)}`);
      return response.data;
    },
    enabled: !!errorMessage,
  });
}

export function useResolveError() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (errorMessage: string) => {
      const response = await api.put(`/api/AdminLogs/resolve?errorMessage=${encodeURIComponent(errorMessage)}`);
      return response.data;
    },
    onSuccess: (_, errorMessage) => {
      // Invalidate the summary and details for this error
      queryClient.invalidateQueries({ queryKey: ["system-errors-summary"] });
      queryClient.invalidateQueries({ queryKey: ["system-errors-details", errorMessage] });
    },
  });
}

export async function logClientError(errorMessage: string, errorDetails?: string, errorSource?: string) {
  try {
    await api.post("/api/AdminLogs/client-error", {
      errorMessage,
      errorDetails,
      errorSource: errorSource || "FRONTEND",
    });
  } catch (error) {
    // Silently fail if logging fails so we don't cause an infinite loop
    console.error("Failed to log client error to backend", error);
  }
}
