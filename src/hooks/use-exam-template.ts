import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { examTemplateApi } from "@/lib/exam-template-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import type { UploadTeacherExamRequest } from "@/types/exam-template";

export function useUploadTeacherExam() {
    return useMutation({
        mutationFn: (data: UploadTeacherExamRequest) => examTemplateApi.uploadTeacherExam(data),
        onSuccess: () => {
            toast.success("تم حفظ نموذج المعلم بنجاح!");
        },
        onError: (error) => {
            const fieldErrors = getAllFieldErrors(error);
            if (Object.keys(fieldErrors).length === 0) {
                toast.error("حدث خطأ في السيرفر", {
                    description: getErrorMessage(error),
                });
            }
        },
    });
}
