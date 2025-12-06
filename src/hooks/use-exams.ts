import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { examsApi } from "@/lib/exams-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import type {
  UploadExamRequest,
  GenerateStudentPapersRequest,
} from "@/types/exams";

/**
 * Hook to get all exams
 */
export function useGetExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => examsApi.getExams(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get a single exam by ID
 */
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

/**
 * Hook to upload a new exam
 */
export function useUploadExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadExamRequest) => examsApi.uploadExam(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      // API returns success status or error message
      if (response.success !== false) {
        toast.success("تم رفع الامتحان بنجاح", {
          description: response.message || "تم حفظ الامتحان بنجاح",
        });
      } else {
        toast.error("فشل رفع الامتحان", {
          description: response.message || "حدث خطأ أثناء رفع الامتحان",
        });
      }
    },
    onError: (error) => {
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل رفع الامتحان", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Hook to delete an exam
 */
export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: string) => examsApi.deleteExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("تم حذف الامتحان بنجاح");
    },
    onError: (error) => {
      toast.error("فشل حذف الامتحان", {
        description: getErrorMessage(error),
      });
    },
  });
}

/**
 * Hook to generate student papers
 */
export function useGenerateStudentPapers() {
  return useMutation({
    mutationFn: (data: GenerateStudentPapersRequest) =>
      examsApi.generateStudentPapers(data),
    onSuccess: (response) => {
      if (response.success !== false) {
        toast.success("تم إنشاء أوراق الطلاب بنجاح", {
          description: response.message || "تم إنشاء أوراق الطلاب بنجاح",
        });
      } else {
        toast.error("فشل إنشاء أوراق الطلاب", {
          description: response.message || "حدث خطأ أثناء إنشاء أوراق الطلاب",
        });
      }
    },
    onError: (error) => {
      toast.error("فشل إنشاء أوراق الطلاب", {
        description: getErrorMessage(error),
      });
    },
  });
}

/**
 * Hook to download exam papers
 */
export function useDownloadExamPapers() {
  return useMutation({
    mutationFn: async (examId: string) => {
      const { blob, filename } = await examsApi.downloadExamPapers(examId);

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    },
    onSuccess: (result) => {
      toast.success("تم تحميل أوراق الامتحان بنجاح", {
        description: `تم تحميل الملف: ${result.filename}`,
      });
    },
    onError: (error) => {
      toast.error("فشل تحميل أوراق الامتحان", {
        description: getErrorMessage(error),
      });
    },
  });
}

