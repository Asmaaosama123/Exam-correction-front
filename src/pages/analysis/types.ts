export interface GoalAnalysis {
    goalText: string;
    successRate: number;
    questionNumbers: number[];
}

export interface QuestionAnalysis {
    questionNumber: number;
    questionDisplay?: string;
    successRate: number;
    correctCount: number;
}

export interface ClassReport {
    goalAnalysis: GoalAnalysis[];
    questionAnalysis: QuestionAnalysis[];
    overallPercentage: number;
    totalStudents: number;
    passedStudents: number;
    failedStudents: number;
}

export interface StudentReport {
    studentName: string;
    percentage: number;
    totalCorrect: number;
    goalAnalysis: GoalAnalysis[];
    answers?: {
        ok: boolean;
        type: string;
        questionNumber: number;
        correctAnswer?: string;
        studentAnswer?: string;
        score?: number;
        maxScore?: number;
    }[];
}

export interface ExamPaper {
    id: number;
    className: string;
    classId?: number;
    studentName: string;
    finalScore?: number;
    totalQuestions: number;
}

export interface Exam {
    id: number;
    title: string;
    subject: string;
    createdAt?: string;
}

export interface Stats {
    count: number;
    max: number;
    min: number;
    avg: number;
    pct: number;
    sum: number;
    maxScore: number;
    levels: {
        excellent: { count: number; percentage: number };
        veryGood: { count: number; percentage: number };
        good: { count: number; percentage: number };
        acceptable: { count: number; percentage: number };
        weak: { count: number; percentage: number };
    };
    criticalCount: number;
}
