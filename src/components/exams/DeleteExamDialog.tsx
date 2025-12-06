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
import { useDeleteExam, useGetExam } from "@/hooks/use-exams";
import { Skeleton } from "@/components/ui/skeleton";

interface DeleteExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  onSuccess?: () => void;
}

export function DeleteExamDialog({
  open,
  onOpenChange,
  examId,
  onSuccess,
}: DeleteExamDialogProps) {
  const deleteMutation = useDeleteExam();
  const { data: examData, isLoading } = useGetExam(examId);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(examId, {
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
          <DialogTitle>حذف الامتحان</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من رغبتك في حذف هذا الامتحان؟
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
                  سيتم حذف الامتحان التالي نهائياً:
                </p>
                <p className="text-sm text-foreground mt-1">
                  {examData?.title}
                </p>
                {examData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    المادة: {examData.subject}
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

