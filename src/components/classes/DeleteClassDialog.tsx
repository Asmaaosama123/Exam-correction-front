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
import { useDeleteClass, useGetClass } from "@/hooks/use-classes";
import { Skeleton } from "@/components/ui/skeleton";

interface DeleteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onSuccess?: () => void;
}

export function DeleteClassDialog({
  open,
  onOpenChange,
  classId,
  onSuccess,
}: DeleteClassDialogProps) {
  const deleteMutation = useDeleteClass();
  const { data: classData, isLoading } = useGetClass(classId, {
    enabled: open && !!classId,
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(classId, {
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
          <DialogTitle>حذف الفصل</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من رغبتك في حذف هذا الفصل؟
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  سيتم حذف الفصل التالي نهائياً:
                </p>
                <p className="text-sm text-foreground mt-1">
                  {classData?.name}
                </p>
                {classData && classData.numberOfStudents > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    تحذير: يحتوي هذا الفصل على {classData.numberOfStudents} طالب
                  </p>
                )}
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
            disabled={deleteMutation.isPending || isLoading}
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

