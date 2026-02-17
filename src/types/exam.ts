// types/exam.ts

export type QuestionType = "mcq" | "true_false" | "essay";
export type AnswerDirection = "horizontal" | "vertical";
export type Language = "ar" | "en";

export interface OptionBox {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  originalIndex: number;
}

export interface Question {
  id: string;
  index: number;
  type: QuestionType;
  answer: string;
  options: OptionBox[];
  page: number;
  answerDirection?: AnswerDirection;
  mcqOptionCount?: number;
}

export interface ExamTemplateJson {
  canvas: { width: number; height: number };
  questions: Array<{
    id: string;
    type: string;
    answer: string;
    roi: [number, number, number, number];
    rois?: Record<string, [number, number, number, number]>;
  }>;
}