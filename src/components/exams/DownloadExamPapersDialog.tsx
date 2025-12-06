import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDownloadExamPapers } from "@/hooks/use-exams";
import { useGetExams } from "@/hooks/use-exams";

interface DownloadExamPapersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DownloadExamPapersDialog({
  open,
  onOpenChange,
  onSuccess,
}: DownloadExamPapersDialogProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>("");

  const downloadMutation = useDownloadExamPapers();
  const { data: exams, isLoading: examsLoading } = useGetExams();

  const handleDownload = () => {
    if (!selectedExamId) {
      return;
    }

    downloadMutation.mutate(selectedExamId, {
      onSuccess: () => {
        setSelectedExamId("");
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setSelectedExamId("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تحميل أوراق الامتحان</DialogTitle>
          <DialogDescription>
            اختر الامتحان لتحميل جميع أوراق الطلاب كملف ZIP
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exam Selection */}
          <div className="space-y-2">
            <Label htmlFor="exam-select">اختر الامتحان *</Label>
            {examsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedExamId}
                onValueChange={setSelectedExamId}
              >
                <SelectTrigger id="exam-select">
                  <SelectValue placeholder="اختر الامتحان" />
                </SelectTrigger>
                <SelectContent>
                  {exams && exams.length > 0 ? (
                    exams.map((exam) => (
                      <SelectItem key={exam.id} value={String(exam.id)}>
                        {exam.title} - {exam.subject}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-exams" disabled>
                      لا توجد امتحانات متاحة
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedExamId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                سيتم تحميل ملف ZIP يحتوي على جميع أوراق الطلاب للامتحان المحدد.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={downloadMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDownload}
            disabled={
              downloadMutation.isPending ||
              !selectedExamId ||
              examsLoading
            }
          >
            {downloadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 ml-2" />
                تحميل أوراق PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

