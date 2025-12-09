import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingApi } from "@/lib/grading-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import type {
  GradePaperRequest,
  GetGradingResultsRequest,
} from "@/types/grading";

/**
 * Hook to grade a single exam paper
 */
export function useGradePaper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GradePaperRequest) => gradingApi.gradePaper(data),
    onSuccess: (response) => {
      // Invalidate grading results to refresh the table
      queryClient.invalidateQueries({ queryKey: ["grading", "results"] });

      if (response.success) {
        toast.success("تم تصحيح الورقة بنجاح", {
          description: `الدرجة: ${response.grade}${
            response.maxGrade ? ` / ${response.maxGrade}` : ""
          }`,
        });
      } else {
        toast.error("فشل تصحيح الورقة", {
          description: response.message || "حدث خطأ أثناء تصحيح الورقة",
        });
      }
    },
    onError: (error) => {
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل تصحيح الورقة", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Hook to get grading results with pagination and filters
 */
export function useGetGradingResults(params: GetGradingResultsRequest) {
  return useQuery({
    queryKey: ["grading", "results", params],
    queryFn: () => gradingApi.getGradingResults(params),
    staleTime: 30 * 1000, // 30 seconds - grading results change frequently
    keepPreviousData: true, // Keep previous data while fetching new page
  });
}
