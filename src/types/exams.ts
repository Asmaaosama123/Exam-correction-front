/**
 * Exams Types
 * Single source of truth for all exam-related types
 */

// ==================== Exam Types ====================

export interface Exam {
  id: number;
  title: string;
  subject: string;
  pdfPath: string;
  numberOfPages: number;
  createdAt: string;
}

// ==================== Request Types ====================

export interface UploadExamRequest {
  title: string;
  subject: string;
  file: File;
}

export interface GenerateStudentPapersRequest {
  examId: string;
  classId: string;
  x: number; // X coordinate in PDF points (1 point = 1/72 inch)
  y: number; // Y coordinate in PDF points (from bottom)
  examName?: string;
}

// ==================== Response Types ====================

export type GetExamsResponse = Exam[];

export type GetExamResponse = Exam;

export interface UploadExamResponse {
  success: boolean;
  examId?: string;
  message?: string;
}

// ==================== Error Types ====================

export const ExamErrorCode = {
  ExamNotFound: "Exam.ExamNotFound",
  InvalidExamId: "Exam.InvalidExamId",
  InvalidClassId: "Class.InvalidClassId",
  InvalidFileFormat: "File.InvalidFileFormat",
  MaxFileSize: "File.MaxFileSize",
} as const;

export type ExamErrorCode = (typeof ExamErrorCode)[keyof typeof ExamErrorCode];
