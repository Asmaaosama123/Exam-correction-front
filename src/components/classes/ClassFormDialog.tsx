import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  useAddClass,
  useUpdateClass,
  useGetClass,
} from "@/hooks/use-classes";
import { getFieldErrors } from "@/lib/api";

// Zod schema for class form
const classFormSchema = z.object({
  name: z
    .string()
    .min(1, "اسم الفصل مطلوب")
    .min(3, "اسم الفصل يجب أن يكون على الأقل 3 أحرف")
    .max(100, "اسم الفصل يجب ألا يتجاوز 100 حرف"),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
  onSuccess?: () => void;
}

export function ClassFormDialog({
  open,
  onOpenChange,
  classId,
  onSuccess,
}: ClassFormDialogProps) {
  const isEditMode = !!classId;

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const addMutation = useAddClass();
  const updateMutation = useUpdateClass();
  const { data: classData, isLoading: isLoadingClass } = useGetClass(
    classId || "",
    { enabled: isEditMode && !!classId && open }
  );

  // Load class data when editing
  useEffect(() => {
    if (isEditMode && classData && open) {
      form.reset({
        name: classData.name,
      });
    } else if (!isEditMode && open) {
      form.reset({
        name: "",
      });
    }
  }, [isEditMode, classData, open, form]);

  const error = isEditMode ? updateMutation.error : addMutation.error;
  const isPending = isEditMode
    ? updateMutation.isPending
    : addMutation.isPending;

  // Set API errors to form
  useEffect(() => {
    if (error) {
      const nameErrors = getFieldErrors(error, "name");
      if (nameErrors.length > 0) {
        form.setError("name", {
          type: "server",
          message: nameErrors[0],
        });
      }
    }
  }, [error, form]);

  const onSubmit = async (values: ClassFormValues) => {
    try {
      if (isEditMode && classId) {
        await updateMutation.mutateAsync({ classId, data: values });
        onSuccess?.();
        onOpenChange(false);
        form.reset();
      } else {
        await addMutation.mutateAsync(values);
        onSuccess?.();
        onOpenChange(false);
        form.reset();
      }
    } catch (err) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "تعديل بيانات الفصل" : "إضافة فصل جديد"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "قم بتعديل بيانات الفصل أدناه"
              : "أدخل بيانات الفصل الجديد أدناه"}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoadingClass ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">
              جاري تحميل بيانات الفصل...
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الفصل</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل اسم الفصل"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    form.reset();
                  }}
                  disabled={isPending}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      {isEditMode ? "جاري التحديث..." : "جاري الإضافة..."}
                    </>
                  ) : isEditMode ? (
                    "تحديث"
                  ) : (
                    "إضافة"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

