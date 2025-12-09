/**
 * Grading Types
 * Single source of truth for all grading-related types
 */

// ==================== Grading Types ====================

export interface GradingResult {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examName: string;
  examSubject: string;
  className: string;
  classId: string;
  grade: number;
  maxGrade?: number;
  gradedAt: string;
}

// ==================== Request Types ====================

export interface GradePaperRequest {
  file: File;
}

export interface GradePaperResponse {
  success: boolean;
  studentId: string;
  examId: string;
  grade: number;
  maxGrade?: number;
  message?: string;
}

export interface GetGradingResultsRequest {
  pageNumber?: number;
  pageSize?: number;
  examId?: string;
  classId?: string;
  searchValue?: string; // Search by exam name or student name
}

// ==================== Response Types ====================

export interface GetGradingResultsResponse {
  items: GradingResult[];
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  totalCount: number;
}

// ==================== Error Types ====================

export const GradingErrorCode = {
  PaperNotFound: "Grading.PaperNotFound",
  InvalidBarcode: "Grading.InvalidBarcode",
  StudentNotFound: "Grading.StudentNotFound",
  ExamNotFound: "Grading.ExamNotFound",
  InvalidFileFormat: "File.InvalidFileFormat",
  MaxFileSize: "File.MaxFileSize",
  ProcessingError: "Grading.ProcessingError",
} as const;

export type GradingErrorCode =
  (typeof GradingErrorCode)[keyof typeof GradingErrorCode];
