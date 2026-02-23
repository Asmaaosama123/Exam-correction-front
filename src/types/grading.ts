export interface GradingDetail {
  id: string;
  type: "mcq" | "true_false";
  gt: string;
  pred: string;
  conf: number;
  ok: boolean;
  method: string;
  points: number;
}

export interface ExamResult {
  filename: string;
  student_info?: {
    student_id: string;
    student_name: string;
  };
  details: {
    score: number;
    total: number;
    details: GradingDetail[];
  };
  annotated_image_url: string;
}

export interface ProcessExamResponse {
  results: ExamResult[];
}

export interface GradingResultEntry {
  id: string;
  studentId: string;
  studentName: string;
  examId: number;
  examName: string;
  examSubject: string;
  classId: string;
  className: string;
  grade: number;
  maxGrade: number;
  gradedAt: string;
  pdfPath?: string;
  annotatedImageUrl?: string;
  questionDetails?: GradingDetail[];
}

export interface GradingResultsFilter {
  pageNumber: number;
  pageSize: number;
  examId?: string;
  classId?: string;
  searchValue?: string;
}

export interface GradingResultsResponse {
  items: GradingResultEntry[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}