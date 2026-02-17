// src/types/grading.ts

export interface GradingDetail {
  id: string;
  type: "mcq" | "true_false";
  gt: string;
  pred: string;
  conf: number;
  ok: boolean;
  method: string;
}

export interface ExamResult {
  id?: string;                   // اختياري
  filename: string;
  studentName?: string;          // اختياري
  examName?: string;             // اختياري
  examSubject?: string;          // اختياري
  className?: string;            // اختياري
  grade?: number;                // اختياري (إذا كان متوفراً مباشرة)
  maxGrade?: number;             // اختياري
  gradedAt?: string;             // اختياري
  details: {
    score: number;
    total: number;
    details: GradingDetail[];
  };
  annotated_image_url: string;
}

export interface GradePaperRequest {
  examId: string;
  studentId?: string;
  image?: string;
  file: File | Blob;
}

export interface GetGradingResultsRequest {
  examId?: string;
  page?: number;
  pageNumber?: number;
  pageSize?: number;
  classId?: string;
  searchValue?: string;
  limit?: number;
}

export interface GetGradingResultsResponse {
  items: ExamResult[];
  total: number;
  page: number;
  pages: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GradePaperResponse {
  success: boolean;
  message?: string;
  grade: number;
  maxGrade?: number;
}