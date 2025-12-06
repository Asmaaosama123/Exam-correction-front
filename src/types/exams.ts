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
}

export interface DownloadExamPapersRequest {
  examId: string;
}

// ==================== Response Types ====================

export interface GetExamsResponse extends Array<Exam> {}

export interface GetExamResponse extends Exam {}

export interface UploadExamResponse {
  success: boolean;
  examId?: string;
  message?: string;
}

export interface GenerateStudentPapersResponse {
  success: boolean;
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

export type ExamErrorCode =
  (typeof ExamErrorCode)[keyof typeof ExamErrorCode];

