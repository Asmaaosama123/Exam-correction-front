import { api } from "./api";
import type {
  GetExamsResponse,
  GetExamResponse,
  UploadExamRequest,
  UploadExamResponse,
  GenerateStudentPapersRequest,
  ExamGoal,
  SaveExamGoalsRequest,
} from "@/types/exams";
import { AxiosError } from "axios";
import { formatArabicDate, sanitizeFilename } from "./utils";

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
   * Upload a new exam with question paper PDF and barcode coordinates
   */
  uploadExam: async (data: UploadExamRequest): Promise<UploadExamResponse> => {
    const formData = new FormData();
    formData.append("File", data.file);
    formData.append("Title", data.title);
    formData.append("Subject", data.subject);
    formData.append("BarcodeData", data.barcodeData);
    if (data.nameMarkData) {
      formData.append("NameMarkData", data.nameMarkData);
    }
    if (data.fiducialsData) {
      formData.append("FiducialsData", data.fiducialsData);
    }

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
        "/api/Exam/generate-download-exams",
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


  /**
   * Get all student exam papers for a specific exam
   */
  getExamPapers: async (examId: number): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/Analysis/exam/${examId}/papers`);
    return response.data;
  },

  /**
   * Get goals for a specific exam
   */
  getExamGoals: async (examId: number): Promise<ExamGoal[]> => {
    const response = await api.get<ExamGoal[]>(`/api/ExamGoals/${examId}`);
    return response.data;
  },

  /**
   * Save goals for a specific exam
   */
  saveExamGoals: async (data: SaveExamGoalsRequest): Promise<void> => {
    await api.post(`/api/ExamGoals/${data.examId}`, data.goals, {
      params: { isPartial: data.isPartial }
    });
  },

  /**
   * Get class-wide analysis report for an exam
   */
  getClassReport: async (examId: number): Promise<any> => {
    const response = await api.get<any>(`/api/Analysis/exam/${examId}/class-report`);
    return response.data;
  },

  /**
   * Create a single goal
   */
  createExamGoal: async (goal: ExamGoal): Promise<ExamGoal> => {
    const response = await api.post<ExamGoal>("/api/ExamGoals", goal);
    return response.data;
  },

  /**
   * Delete a single goal by ID
   */
  deleteExamGoal: async (goalId: number): Promise<void> => {
    await api.delete(`/api/ExamGoals/${goalId}`);
  },

  /**
    * Get individual student analysis report for a specific paper
    */
  getStudentReport: async (paperId: number): Promise<any> => {
    const response = await api.get<any>(`/api/Analysis/paper/${paperId}/student-report`);
    return response.data;
  },
  /**
   * Download a detailed analysis PDF report (either class or individual student)
   */
  downloadDetailedAnalysisPdf: async (data: {
    examId: number,
    paperId?: number,
    classId?: number,
    radarImageBase64?: string,
    barChartImageBase64?: string,
    strengthRadarImageBase64?: string,
    weaknessRadarImageBase64?: string,
    classStrengthRadarImageBase64?: string,
    classWeaknessRadarImageBase64?: string,
    questionBarImageBase64?: string,
    studentCharts?: {
      paperId: number;
      generalRadarBase64?: string;
      strengthRadarBase64?: string;
      weaknessRadarBase64?: string
    }[]
  }): Promise<{ blob: Blob; filename?: string }> => {
    try {
      const response = await api.post<Blob>(
        "/api/AnalysisReports/report-detailed-analysis-pdf",
        data,
        {
          responseType: "blob",
          validateStatus: (status) => status < 400,
        }
      );

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers["content-disposition"];
      let filename: string | undefined = undefined;

      if (contentDisposition) {
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]*)/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          try {
            filename = decodeURIComponent(filenameStarMatch[1]);
          } catch (e) {
            console.error("Error decoding filename:", e);
          }
        }

        if (!filename) {
          const filenameMatch = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          );
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        }
      }

      if (filename && /^[-_.]+$/.test(filename)) {
        filename = undefined;
      }

      if (!filename) {
        const dateStr = formatArabicDate(new Date());
        filename = `تقرير_التحليل_${dateStr}.pdf`;
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
            errors: [{ code: "DownloadError", description: "حدث خطأ أثناء تحميل تقرير التحليل" }],
          },
          status: 500,
        },
        isAxiosError: true,
      };
    }
  },

  /**
   * Download a student progress PDF report
   */
  downloadStudentProgressPdf: async (data: {
    studentId?: number,
    progressChartBase64?: string,
    overviewChartBase64?: string
  }): Promise<{ blob: Blob; filename?: string }> => {
    try {
      const response = await api.post<Blob>(
        "/api/AnalysisReports/report-student-progress-pdf",
        data,
        {
          responseType: "blob",
          validateStatus: (status) => status < 400,
        }
      );

      const contentDisposition = response.headers["content-disposition"];
      let filename: string | undefined = undefined;

      if (contentDisposition) {
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]*)/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          try {
            filename = decodeURIComponent(filenameStarMatch[1]);
          } catch (e) {
            console.error("Error decoding filename:", e);
          }
        }

        if (!filename) {
          const filenameMatch = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          );
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        }
      }

      if (!filename) {
        filename = data.studentId ? "تقرير_تطور_طالب.pdf" : "ملخص_أداء_الطلاب.pdf";
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
            errors: [{ code: "DownloadError", description: "حدث خطأ أثناء تحميل تقرير التطور" }],
          },
          status: 500,
        },
        isAxiosError: true,
      };
    }
  },

 
  /**
   * Get overall student progress across all exams
   */
  getStudentProgress: async (studentId: string): Promise<any> => {
    const response = await api.get<any>(`/api/Analysis/student/${studentId}/progress`);
    return response.data;
  },

  /**
   * Get summary of student progress across all students or a specific class
   */
  getStudentsProgressSummary: async (classId?: number): Promise<any[]> => {
    const response = await api.get<any[]>("/api/Analysis/students-progress-summary", {
      params: { classId }
    });
    return response.data;
  },
};
