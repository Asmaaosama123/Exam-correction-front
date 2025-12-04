import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { classesApi } from "@/lib/classes-api";
import { getErrorMessage, getAllFieldErrors } from "@/lib/api";
import type { AddClassRequest, UpdateClassRequest } from "@/types/classes";

/**
 * Hook to get all classes
 */
export function useGetClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: () => classesApi.getClasses(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get a single class by ID
 */
export function useGetClass(
  classId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["classes", classId],
    queryFn: () => classesApi.getClass(classId),
    enabled: options?.enabled !== undefined ? options.enabled : !!classId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to add a new class
 */
export function useAddClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddClassRequest) => classesApi.addClass(data),
    onSuccess: () => {
      // Invalidate classes list queries
      queryClient.invalidateQueries({ queryKey: ["classes"] });

      toast.success("تم إضافة الفصل بنجاح", {
        description: "تم إضافة الفصل إلى النظام",
      });
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل إضافة الفصل", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Hook to update an existing class
 */
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      data,
    }: {
      classId: string;
      data: UpdateClassRequest;
    }) => classesApi.updateClass(classId, data),
    onSuccess: (response, variables) => {
      // Invalidate specific class and list queries
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });

      // Use response data if available, otherwise use submitted data
      const className = response?.name || variables.data.name;

      toast.success("تم تحديث بيانات الفصل بنجاح", {
        description: `تم تحديث بيانات ${className}`,
      });
    },
    onError: (error) => {
      // Only show toast if there are no field-specific errors
      const fieldErrors = getAllFieldErrors(error);
      if (Object.keys(fieldErrors).length === 0) {
        toast.error("فشل تحديث بيانات الفصل", {
          description: getErrorMessage(error),
        });
      }
    },
  });
}

/**
 * Hook to delete a class
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => classesApi.deleteClass(classId),
    onSuccess: () => {
      // Invalidate classes list queries
      queryClient.invalidateQueries({ queryKey: ["classes"] });

      toast.success("تم حذف الفصل بنجاح", {
        description: "تم حذف الفصل من النظام",
      });
    },
    onError: (error) => {
      toast.error("فشل حذف الفصل", {
        description: getErrorMessage(error),
      });
    },
  });
}

