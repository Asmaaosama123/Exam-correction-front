import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { examsApi } from "@/lib/exams-api";
/*import { getErrorMessage } from "@/lib/api";
*/
import type { SaveExamGoalsRequest } from "@/types/exams";

export function useGetExamGoals(examId: number | null) {
    return useQuery({
        queryKey: ["exam-goals", examId],
        queryFn: () => {
            if (!examId) throw new Error("Exam ID is required");
            return examsApi.getExamGoals(examId);
        },
        enabled: !!examId,
    });
}

export function useSaveExamGoals() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SaveExamGoalsRequest) => examsApi.saveExamGoals(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["exam-goals", variables.examId] });
            queryClient.invalidateQueries({ queryKey: ["class-report", variables.examId] });
            queryClient.invalidateQueries({ queryKey: ["exam-papers", variables.examId] });
            toast.success("تم حفظ الأهداف بنجاح");
        },
    });
}
export function useCreateExamGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (goal: any) => examsApi.createExamGoal(goal),
        onSuccess: (newGoal) => {
            queryClient.invalidateQueries({ queryKey: ["exam-goals", newGoal.examId] });
            toast.success("تم إضافة الهدف بنجاح");
        },
    });
}

export function useDeleteExamGoal(examId: number | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (goalId: number) => examsApi.deleteExamGoal(goalId),
        onSuccess: () => {
            if (examId) {
                queryClient.invalidateQueries({ queryKey: ["exam-goals", examId] });
            }
            toast.success("تم حذف الهدف بنجاح");
        },
    });
}
