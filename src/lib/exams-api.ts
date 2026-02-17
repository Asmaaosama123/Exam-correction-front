import { api } from "./api";
import type {
  GetExamsResponse,
  GetExamResponse,
  UploadExamRequest,
  UploadExamResponse,
  GenerateStudentPapersRequest,
} from "@/types/exams";
import { AxiosError } from "axios";
import { formatArabicDate, sanitizeFilename } from "./utils";

// Exams API endpoints
export const examsApi = {
  /**
   * Get all exams
   */
  getExams: async (): Promise<GetExamsResponse> => {
    const response = await api.get<GetExamsResponse>("/Exam");
    return response.data;
  },

  /**
   * Get a single exam by ID
   */
  getExam: async (examId: string): Promise<GetExamResponse> => {
    const response = await api.get<GetExamResponse>(`/Exam/${examId}`);
    return response.data;
  },

  /**
   * Delete an exam by ID
   */
  deleteExam: async (examId: string): Promise<{ success: boolean }> => {
    await api.delete(`/Exam/${examId}`);
    return { success: true };
  },

  /**
   * Upload a new exam with question paper PDF and barcode coordinates
   */
  uploadExam: async (data: UploadExamRequest): Promise<UploadExamResponse> => {
    const formData = new FormData();
    formData.append("File", data.file);
    formData.append("Title", data.title);
    formData.append("Subject", data.subject);
    formData.append("BarcodeData", data.barcodeData);

    const response = await api.post<UploadExamResponse>(
      "/Exam/upload-exam",
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
   * Generate and download student papers for a specific exam and class
   * This endpoint generates the papers and returns a ZIP file for download
   */
  generateAndDownloadExamPapers: async (
    data: GenerateStudentPapersRequest
  ): Promise<{ blob: Blob; filename?: string }> => {
    try {
      const requestBody: GenerateStudentPapersRequest = {
        examId: data.examId,
        classId: data.classId,
      };

      const response = await api.post<Blob>(
        "/Exam/generate-download-exams",
        requestBody,
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
                code: "GenerateDownloadError",
                description: "فشل إنشاء وتحميل أوراق الاختبار",
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
        } as AxiosError;
        throw axiosError;
      }

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers["content-disposition"];
      let filename: string | undefined = undefined;

      if (contentDisposition) {
        // Try custom regex for filename* (UTF-8)
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]*)/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          try {
            filename = decodeURIComponent(filenameStarMatch[1]);
          } catch (e) {
            console.error("Error decoding filename:", e);
          }
        }

        // Fallback to standard filename if filename* not found
        if (!filename) {
          const filenameMatch = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          );
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        }
      }

      // If filename is just dashes or underscores (sanitized by server), treat as missing
      if (filename && /^[-_.]+$/.test(filename)) {
        filename = undefined;
      }

      // 2. التعديل الجوهري هنا:
      // لو السيرفر مبعتش اسم، بنولد اسم يدوي بامتداد .pdf بدلاً من .zip
      if (!filename) {
        const examName = data.examName || "اختبار";
        const className = data.className || "فصل";
        const dateStr = formatArabicDate(new Date());

        const sanitizedExamName = sanitizeFilename(examName);
        const sanitizedClassName = sanitizeFilename(className);

        // غيرنا .zip لـ .pdf هنا
        filename = `${sanitizedExamName}_${sanitizedClassName}_${dateStr}.pdf`;
      }

      return { blob: response.data, filename };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw error;
      }
      throw {
        response: {
          data: {
            title: "خطأ في التحميل",
            status: 500,
            errors: [
              {
                code: "GenerateDownloadError",
                description:
                  // @ts-expect-error - error is of type unknown
                  error.message || "حدث خطأ أثناء إنشاء وتحميل أوراق الاختبار",
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
