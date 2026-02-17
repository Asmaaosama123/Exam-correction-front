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