export type QuestionType = "mcq" | "true_false" | "essay" | "complete";
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
    points?: number; // ✅ الجديد
}

export interface UploadTeacherExamRequest {
    ExamId: number;
    File: File;
    QuestionsJson: string;
}

export interface TeacherExamResponse {
    examId: number;
    pdfPath: string;
    questionsJson: string;
}
