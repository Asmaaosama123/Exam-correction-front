import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { examsApi } from "@/lib/exams-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import type {
  UploadExamRequest,
  GenerateStudentPapersRequest,
} from "@/types/exams";

export function useGetExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => examsApi.getExams(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGetExam(examId: string | null) {
  return useQuery({
    queryKey: ["exams", examId],
    queryFn: () => {
      if (!examId) throw new Error("Exam ID is required");
      return examsApi.getExam(examId);
    },
    enabled: !!examId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUploadExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadExamRequest) => examsApi.uploadExam(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      // API returns success status or error message
      if (response.success !== false) {
        toast.success("تم رفع الاختبار بنجاح", {
          description: response.message || "تم حفظ الاختبار بنجاح",
        });
      } else {
        toast.error("فشل رفع الاختبار", {
          description: response.message || "حدث خطأ أثناء رفع الاختبار",
        });
      }
    },
    onError: (error) => {
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل رفع الاختبار", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: string) => examsApi.deleteExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("تم حذف الاختبار بنجاح");
    },
    onError: (error) => {
      toast.error("فشل حذف الاختبار", {
        description: getErrorMessage(error),
      });
    },
  });
}

/**
 * Hook to generate and download student papers
 */
export function useGenerateAndDownloadExamPapers() {
  return useMutation({
    mutationFn: async (data: GenerateStudentPapersRequest) => {
      const { blob, filename } = await examsApi.generateAndDownloadExamPapers(data);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // التعديل هنا: نغير الامتداد الافتراضي إلى .pdf
      // إذا كان الباك إند يرسل FileName، سيستخدمه المتصفح
      link.download = filename || `${data.className}_exams.pdf`; 
      
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      return { success: true };
    },
    onSuccess: () => {
      toast.success("تم إنشاء وتحميل أوراق الطلاب بنجاح", {
        description: "تم تحميل الملف بنجاح",
      });
    },
    onError: (error) => {
      toast.error("فشل إنشاء وتحميل أوراق الطلاب", {
        description: getErrorMessage(error),
      });
    },
  });
}
