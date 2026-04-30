import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteStudent, useGetStudent } from "@/hooks/use-students";
import { Skeleton } from "@/components/ui/skeleton";
import type { Student } from "@/types/students";

interface DeleteStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  classId?: string;
  studentData?: Student;
  onSuccess?: () => void;
}

export function DeleteStudentDialog({
  open,
  onOpenChange,
  studentId,
  classId,
  studentData,
  onSuccess,
}: DeleteStudentDialogProps) {
  const deleteMutation = useDeleteStudent();
  const { data: fetchedStudent, isLoading } = useGetStudent({
    studentId,
    classId: classId || "",
  });

  // Use provided studentData if available, otherwise use fetched student
  const student = studentData || fetchedStudent;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(studentId, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>حذف الطالب</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من رغبتك في حذف هذا الطالب؟
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!studentData && isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : student ? (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  سيتم حذف الطالب التالي نهائياً:
                </p>
                <p className="text-sm text-foreground mt-1">
                  {student.fullName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {student.email || "لا يوجد"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  سيتم حذف الطالب نهائياً
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || (!studentData && isLoading)}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الحذف...
              </>
            ) : (
              "حذف"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
