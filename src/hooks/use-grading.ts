import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gradingApi } from "@/lib/grading-api";
import type { GradingResultsFilter } from "@/types/grading";

export function useProcessExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => gradingApi.processExam(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-results"] });
    }
  });
}

export function useGetGradingResults(params: GradingResultsFilter) {
  return useQuery({
    queryKey: ["grading-results", params],
    queryFn: () => gradingApi.getGradingResults(params),
  });
}
