import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tutorialsApi } from "@/lib/tutorials-api";
import { toast } from "sonner";

export const useTutorials = () => {
    return useQuery({
        queryKey: ["tutorials"],
        queryFn: tutorialsApi.getAll,
    });
};

export const useCreateTutorial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tutorialsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tutorials"] });
            toast.success("تم رفع الفيديو بنجاح.");
        },
        onError: (error: any) => {
            const message = error.response?.data?.Description || "حدث خطأ أثناء رفع الفيديو.";
            toast.error(message);
        },
    });
};

export const useDeleteTutorial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tutorialsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tutorials"] });
            toast.success("تم حذف الفيديو بنجاح.");
        },
        onError: (error: any) => {
            const message = error.response?.data?.Description || "حدث خطأ أثناء حذف الفيديو.";
            toast.error(message);
        },
    });
};
