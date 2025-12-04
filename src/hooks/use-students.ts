import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studentsApi } from "@/lib/students-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import type {
  GetStudentsRequest,
  GetStudentRequest,
  AddStudentRequest,
  UpdateStudentRequest,
  ImportStudentsResponse,
  ExportFormat,
  ExportStudentsRequest,
} from "@/types/students";

/**
 * Hook to get all students with pagination and filtering
 */
export function useGetStudents(params: GetStudentsRequest) {
  return useQuery({
    queryKey: ["students", params.classId, params.pageNumber, params.pageSize, params.SearchValue],
    queryFn: () => studentsApi.getStudents(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single student by ID
 */
export function useGetStudent(params: GetStudentRequest) {
  return useQuery({
    queryKey: ["students", params.studentId, params.classId],
    queryFn: () => studentsApi.getStudent(params),
    enabled: !!params.studentId && !!params.classId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to add a new student
 */
export function useAddStudent(classId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, classId: providedClassId }: { data: AddStudentRequest; classId: string }) => 
      studentsApi.addStudent(providedClassId || classId || "", data),
    onSuccess: () => {
      // Invalidate students list queries
      queryClient.invalidateQueries({ queryKey: ["students"] });
      
      toast.success("تم إضافة الطالب بنجاح", {
        description: "تم إضافة الطالب إلى النظام",
      });
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل إضافة الطالب", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Hook to update an existing student
 * Note: classId and isDisabled are now included in the data object
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: UpdateStudentRequest }) =>
      studentsApi.updateStudent(studentId, data),
    onSuccess: (response, variables) => {
      // Invalidate specific student and list queries
      queryClient.invalidateQueries({ queryKey: ["students", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      
      // Use response data if available, otherwise use submitted data
      const fullName = response?.fullName || variables.data.fullName;
      
      toast.success("تم تحديث بيانات الطالب بنجاح", {
        description: `تم تحديث بيانات ${fullName}`,
      });
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل تحديث بيانات الطالب", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => studentsApi.deleteStudent(studentId),
    onSuccess: () => {
      // Invalidate students list queries
      queryClient.invalidateQueries({ queryKey: ["students"] });
      
      toast.success("تم حذف الطالب بنجاح", {
        description: "تم حذف الطالب من النظام",
      });
    },
    onError: (error) => {
      toast.error("فشل حذف الطالب", {
        description: getErrorMessage(error),
      });
    },
  });
}

/**
 * Helper function to format numbers in Arabic
 */
function formatArabicNumber(num: number): string {
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((digit) => arabicNumbers[parseInt(digit)])
    .join("");
}

/**
 * Helper function to get import result message
 */
function getImportMessage(response: ImportStudentsResponse): {
  type: "success" | "error" | "info";
  title: string;
  description: string;
} {
  const { affectedRows, failedRows } = response;

  // No students added
  if (affectedRows === 0 && failedRows > 0) {
    return {
      type: "error",
      title: "فشل استيراد الطلاب",
      description: "لم يتم اضافت اي طالب راجع الملف وحاول مره اخري",
    };
  }

  // Some students failed
  if (affectedRows > 0 && failedRows > 0) {
    return {
      type: "info",
      title: "تم استيراد الطلاب جزئياً",
      description: `تم إضافة ${formatArabicNumber(affectedRows)} طالب وفشل إضافة ${formatArabicNumber(failedRows)} طالب`,
    };
  }

  // All students added successfully
  return {
    type: "success",
    title: "تم استيراد الطلاب بنجاح",
    description: `تم إضافة ${formatArabicNumber(affectedRows)} طالب بنجاح`,
  };
}

/**
 * Hook to import students from Excel file
 */
export function useImportStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => studentsApi.importStudents(file),
    onSuccess: (response) => {
      // Invalidate students list queries
      queryClient.invalidateQueries({ queryKey: ["students"] });

      const message = getImportMessage(response);

      if (message.type === "success") {
        toast.success(message.title, {
          description: message.description,
        });
      } else if (message.type === "info") {
        toast.info(message.title, {
          description: message.description,
        });
      } else {
        toast.error(message.title, {
          description: message.description,
        });
      }
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل استيراد الطلاب", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Helper function to download a blob file
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Hook to export students to PDF or Excel
 */
export function useExportStudents() {
  return useMutation({
    mutationFn: async ({
      classIds,
      format,
    }: {
      classIds: string[];
      format: ExportFormat;
    }) => {
      const requestData: ExportStudentsRequest = { classIds };
      
      // Both PDF and Excel exports now use GET with query parameters
      if (format === "pdf") {
        const { blob, filename } = await studentsApi.exportStudentsToPdf(requestData);
        downloadBlob(blob, filename);
        return blob;
      } else {
        const { blob, filename } = await studentsApi.exportStudentsToExcel(requestData);
        downloadBlob(blob, filename);
        return blob;
      }
    },
    onSuccess: (_, variables) => {
      const formatName = variables.format === "pdf" ? "PDF" : "Excel";
      toast.success("تم التصدير بنجاح", {
        description: `تم تصدير بيانات الطلاب بصيغة ${formatName}`,
      });
    },
    onError: (error) => {
      toast.error("فشل التصدير", {
        description: getErrorMessage(error),
      });
    },
  });
}

