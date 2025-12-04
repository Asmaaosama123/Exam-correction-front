/**
 * Students Types
 * Single source of truth for all student-related types
 */

// ==================== Student Types ====================

export interface Student {
  id: string;
  fullName: string;
  email: string | null;
  mobileNumber: string | null;
  className?: string;
}

// ==================== Request Types ====================

export interface GetStudentsRequest {
  classId?: string;
  pageNumber?: number;
  pageSize?: number;
  SearchValue?: string;
}

export interface GetStudentRequest {
  studentId: string;
  classId: string;
}

export interface AddStudentRequest {
  fullName: string;
  email?: string | null;
  mobileNumber?: string | null;
}

export interface UpdateStudentRequest {
  fullName: string;
  email?: string | null;
  mobileNumber?: string | null;
}

// ==================== Response Types ====================

export interface GetStudentsResponse {
  items: Student[];
  pageNumber: number;
  totalPages: number;
  hasPreviouspage: boolean;
  hasNextPage: boolean;
}

export interface GetStudentResponse extends Student {}

export interface AddStudentResponse extends Student {}

export interface UpdateStudentResponse extends Student {}

export interface DeleteStudentResponse {
  success: boolean;
  message?: string;
}

export interface ImportStudentsResponse {
  affectedRows: number;
  failedRows: number;
}

export interface ExportStudentsRequest {
  classIds: string[]; // Array of class IDs, empty array means all classes
}

export type ExportFormat = "pdf" | "excel";

// ==================== Error Types ====================

// Student-specific error codes
export enum StudentErrorCode {
  StudentNotFound = "Student.StudentNotFound",
  InvalidClassId = "Class.InvalidClassId",
  NotAllowedExtension = "File.NotAllowedExtension",
  MaxFileSize = "File.MaxFileSize",
}

