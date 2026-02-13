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
  id: string;           // تم الإضافة
  filename: string;
  studentName?: string; // تم الإضافة
  examName?: string;    // تم الإضافة
  examSubject?: string; // تم الإضافة
  className?: string;   // تم الإضافة
  grade: number;        // تم الإضافة (مباشرة بدل details.score لو الكود بيستخدمها كدا)
  maxGrade: number;     // تم الإضافة
  gradedAt: string;     // تم الإضافة
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
  file: File | Blob;   // تم الإضافة لأن grading-api بيستخدمها
}

export interface GetGradingResultsRequest {
  examId?: string;
  page?: number;       // تأكد لو بتستخدم page أو pageNumber
  pageNumber?: number; // تم الإضافة لحل خطأ GradingResultsTable
  pageSize?: number;   // تم الإضافة
  classId?: string;    // تم الإضافة
  searchValue?: string;// تم الإضافة
  limit?: number;
}

export interface GetGradingResultsResponse {
  items: ExamResult[];
  total: number;
  page: number;
  pages: number;
  totalPages: number;    // تم الإضافة
  totalCount: number;    // تم الإضافة
  hasPreviousPage: boolean; // تم الإضافة
  hasNextPage: boolean;     // تم الإضافة
}
export interface GradePaperResponse {
  success: boolean;
  message?: string;
  grade: number;
  maxGrade?: number;
}