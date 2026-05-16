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
  ownerId: string;
  barcodeAreaX?: number;
  barcodeAreaY?: number;
  isBarcode: boolean;
}

// ==================== Request Types ====================

export interface UploadExamRequest {
  title: string;
  subject: string;
  file: File;
  barcodeData: string;
  nameMarkData?: string;
  fiducialsData?: string;
}

export interface GenerateStudentPapersRequest {
  examId: string;
  classId: string;
  examName?: string;
  className?: string;
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

// ==================== Goal Types ====================

export interface ExamGoal {
  id?: number;
  examId: number;
  goalText: string;
  questionNumbers: string; // e.g. "1,2,5"
}

export interface SaveExamGoalsRequest {
  examId: number;
  goals: ExamGoal[];
  isPartial?: boolean;
}
