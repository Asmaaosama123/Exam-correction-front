import { api } from "./api";
import type {
  GradePaperRequest,
  GradePaperResponse,
  GetGradingResultsRequest,
  GetGradingResultsResponse,
} from "@/types/grading";

// Grading API endpoints
export const gradingApi = {
  /**
   * Grade a single exam paper (PDF)
   * AI model reads barcode and returns student ID, exam ID, and grade
   */
  gradePaper: async (data: GradePaperRequest): Promise<GradePaperResponse> => {
    const formData = new FormData();
    formData.append("file", data.file);

    const response = await api.post<GradePaperResponse>(
      "/api/Grading/grade-paper",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Get grading results with pagination and filters
   */
  getGradingResults: async (
    params: GetGradingResultsRequest
  ): Promise<GetGradingResultsResponse> => {
    const queryParams = new URLSearchParams({
      pageNumber: String(params.pageNumber || 1),
      pageSize: String(params.pageSize || 10),
    });

    if (params.examId) {
      queryParams.append("examId", params.examId);
    }

    if (params.classId) {
      queryParams.append("classId", params.classId);
    }

    if (params.searchValue) {
      queryParams.append("searchValue", params.searchValue);
    }

    const response = await api.get<GetGradingResultsResponse>(
      `/api/Grading/results?${queryParams.toString()}`
    );
    return response.data;
  },
};
