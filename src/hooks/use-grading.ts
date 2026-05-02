import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gradingApi } from "@/lib/grading-api";
import type { GradingResultsFilter } from "@/types/grading";

export function useProcessExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, templateId }: { file: File; templateId?: number }) => gradingApi.processExam(file, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-results"] });
      // Invalidate auth to get updated remaining quota
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    }
  });
}

export function useGetGradingResults(params: GradingResultsFilter) {
  return useQuery({
    queryKey: ["grading-results", params],
    queryFn: () => gradingApi.getGradingResults(params),
  });
}
export function useUpdateManualGrading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, corrections, studentId }: { id: number; corrections: { questionId: string; isCorrect: boolean; selectedAnswer?: string }[]; studentId?: number }) => 
      gradingApi.updateManualGrading(id, corrections, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-results"] });
    }
  });
}
