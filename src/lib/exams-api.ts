import { api } from "./api";
import type {
  GetExamsResponse,
  GetExamResponse,
  UploadExamRequest,
  UploadExamResponse,
  GenerateStudentPapersRequest,
  GenerateStudentPapersResponse,
} from "@/types/exams";

// Exams API endpoints
export const examsApi = {
  /**
   * Get all exams
   */
  getExams: async (): Promise<GetExamsResponse> => {
    const response = await api.get<GetExamsResponse>("/api/Exam");
    return response.data;
  },

  /**
   * Get a single exam by ID
   */
  getExam: async (examId: string): Promise<GetExamResponse> => {
    const response = await api.get<GetExamResponse>(`/api/Exam/${examId}`);
    return response.data;
  },

  /**
   * Delete an exam by ID
   */
  deleteExam: async (examId: string): Promise<{ success: boolean }> => {
    await api.delete(`/api/Exam/${examId}`);
    return { success: true };
  },

  /**
   * Upload a new exam with question paper PDF (no barcode coordinates)
   */
  uploadExam: async (
    data: UploadExamRequest
  ): Promise<UploadExamResponse> => {
    const formData = new FormData();
    formData.append("File", data.file);
    formData.append("Title", data.title);
    formData.append("Subject", data.subject);

    const response = await api.post<UploadExamResponse>(
      "/api/Exam/upload-exam",
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
   * Generate student papers for a specific exam and class
   */
  generateStudentPapers: async (
    data: GenerateStudentPapersRequest
  ): Promise<GenerateStudentPapersResponse> => {
    const response = await api.post<GenerateStudentPapersResponse>(
      "/api/Exam/generate-exam",
      {
        examId: data.examId,
        classId: data.classId,
      }
    );
    return response.data;
  },

  /**
   * Download all exam papers as ZIP file
   */
  downloadExamPapers: async (
    examId: string
  ): Promise<{ blob: Blob; filename: string }> => {
    try {
      const response = await api.get<Blob>(
        `/api/Exam/${examId}/download-all`,
        {
          responseType: "blob",
          validateStatus: (status) => status < 400, // Don't throw on 4xx/5xx
        }
      );

      // Check if response is actually an error (status >= 400 or JSON content-type)
      const contentType = response.headers["content-type"] || "";
      if (response.status >= 400 || contentType.includes("application/json")) {
        // Convert blob to text and parse as JSON error
        const text = await response.data.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          // If parsing fails, create a generic error
          errorData = {
            title: "خطأ في التحميل",
            status: response.status,
            errors: [
              {
                code: "DownloadError",
                description: "فشل تحميل أوراق الامتحان",
              },
            ],
          };
        }

        // Create an AxiosError-like object that the interceptor can handle
        const axiosError = {
          response: {
            data: errorData,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: response.config,
          },
          isAxiosError: true,
          toJSON: () => ({}),
        } as any;

        // Re-throw through interceptor by calling api again with error status
        // This ensures the interceptor processes it
        throw axiosError;
      }

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers["content-disposition"];
      let filename = `exam_papers_${examId}_${new Date().toISOString().split("T")[0]}.zip`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      return { blob: response.data, filename };
    } catch (error: any) {
      // If it's already an axios error, re-throw it
      if (error.isAxiosError || error.response) {
        throw error;
      }
      // Otherwise, wrap it in axios error format
      throw {
        response: {
          data: {
            title: "خطأ في التحميل",
            status: 500,
            errors: [
              {
                code: "DownloadError",
                description: error.message || "حدث خطأ أثناء تحميل أوراق الامتحان",
              },
            ],
          },
          status: 500,
        },
        isAxiosError: true,
      };
    }
  },
};

