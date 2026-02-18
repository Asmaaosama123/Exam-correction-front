import { api } from "./api";
import type { ProcessExamResponse, GradingResultsFilter, GradingResultsResponse } from "@/types/grading";

export const gradingApi = {
  processExam: async (file: File): Promise<ProcessExamResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ProcessExamResponse>(
      "/api/Exam/process",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  getGradingResults: async (params: GradingResultsFilter): Promise<GradingResultsResponse> => {
    const response = await api.get<GradingResultsResponse>("/api/GradingResults", {
      params,
    });
    return response.data;
  },
};
