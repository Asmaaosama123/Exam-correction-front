export type QuestionType = "mcq" | "true_false" | "essay" | "complete" | "matching";
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

export interface EssaySubQuestion {
    id: number;
    answer: string | null;
    points: number;
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
    points?: number;
    essaySubQuestions?: EssaySubQuestion[]; // ✅ الجديد للمقالي
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
