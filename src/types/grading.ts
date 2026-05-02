export interface GradingDetail {
  id: string;
  type: "mcq" | "true_false";
  gt: string;
  pred: string;
  conf: number;
  ok: boolean;
  method: string;
  points: number;
  options?: string[];
  question_type?: string;
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
  paper_id?: number;
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
  teacherName?: string;
  questionDetails?: GradingDetail[];
}

export interface GradingResultsFilter {
  pageNumber: number;
  pageSize: number;
  examId?: string;
  classId?: string;
  searchValue?: string;
  teacherId?: string;
  onlyAnonymous?: boolean;
}

export interface GradingResultsResponse {
  items: GradingResultEntry[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  anonymousCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}