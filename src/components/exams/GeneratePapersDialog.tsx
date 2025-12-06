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
import { useGenerateStudentPapers } from "@/hooks/use-exams";
import { useGetClasses } from "@/hooks/use-classes";
import { useGetExams } from "@/hooks/use-exams";
import type { GenerateStudentPapersRequest } from "@/types/exams";
import { toast } from "sonner";

interface GeneratePapersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GeneratePapersDialog({
  open,
  onOpenChange,
  onSuccess,
}: GeneratePapersDialogProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const generateMutation = useGenerateStudentPapers();
  const { data: exams, isLoading: examsLoading } = useGetExams();
  const { data: classes, isLoading: classesLoading } = useGetClasses();

  const handleGenerate = () => {
    if (!selectedExamId || !selectedClassId) {
      toast.error("يرجى اختيار الامتحان والفصل");
      return;
    }

    const request: GenerateStudentPapersRequest = {
      examId: selectedExamId,
      classId: selectedClassId,
    };

    generateMutation.mutate(request, {
      onSuccess: () => {
        setSelectedExamId("");
        setSelectedClassId("");
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setSelectedExamId("");
      setSelectedClassId("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إنشاء أوراق الطلاب</DialogTitle>
          <DialogDescription>
            اختر الامتحان والفصل لإنشاء أوراق الطلاب
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exam Selection */}
          <div className="space-y-2">
            <Label htmlFor="exam-select">اختر الامتحان *</Label>
            {examsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
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

          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class-select">اختر الفصل *</Label>
            {classesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  {classes && classes.length > 0 ? (
                    classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name} ({classItem.numberOfStudents} طالب)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>
                      لا توجد فصول متاحة
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedExamId && selectedClassId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                سيتم إنشاء أوراق PDF جاهزة للطباعة لكل طالب في الفصل المحدد.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={generateMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              generateMutation.isPending ||
              !selectedExamId ||
              !selectedClassId ||
              examsLoading ||
              classesLoading
            }
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 ml-2" />
                إنشاء أوراق PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
