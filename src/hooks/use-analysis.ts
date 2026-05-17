import { useQuery } from "@tanstack/react-query";
import { examsApi } from "@/lib/exams-api";

export function useGetClassReport(examId: number | null) {
    return useQuery({
        queryKey: ["class-report", examId],
        queryFn: () => {
            if (!examId) throw new Error("Exam ID is required");
            return examsApi.getClassReport(examId);
        },
        enabled: !!examId,
    });
}

export function useGetStudentReport(paperId: number | null) {
    return useQuery({
        queryKey: ["student-report", paperId],
        queryFn: () => {
            if (!paperId) throw new Error("Paper ID is required");
            return examsApi.getStudentReport(paperId);
        },
        enabled: !!paperId,
    });
}
export function useGetExamPapers(examId: number | null) {
    return useQuery({
        queryKey: ["exam-papers", examId],
        queryFn: () => {
            if (!examId) throw new Error("Exam ID is required");
            return examsApi.getExamPapers(examId);
        },
        enabled: !!examId,
    });
}

export function useGetStudentProgress(studentId: string | null) {
    return useQuery({
        queryKey: ["student-progress", studentId],
        queryFn: () => {
            if (!studentId) throw new Error("Student ID is required");
            return examsApi.getStudentProgress(studentId);
        },
        enabled: !!studentId,
    });
}

export function useGetStudentsProgressSummary(classId?: number) {
    return useQuery({
        queryKey: ["students-progress-summary", classId],
        queryFn: () => examsApi.getStudentsProgressSummary(classId),
    });
}
