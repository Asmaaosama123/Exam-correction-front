import { useMutation } from "@tanstack/react-query";
import { gradingApi } from "@/lib/grading-api";
import type { ProcessExamResponse } from "@/types/grading";

export function useProcessExam() {
  return useMutation({
    mutationFn: (file: File) => gradingApi.processExam(file),
  });
}
