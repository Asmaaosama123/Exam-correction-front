import { useState, useEffect } from "react";
import { Download, Loader2, AlertCircle, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useExportStudents } from "@/hooks/use-students";
import { useGetClasses } from "@/hooks/use-classes";
import { cn } from "@/lib/utils";
import type { ExportFormat } from "@/types/students";

interface ExportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportStudentsDialog({
  open,
  onOpenChange,
}: ExportStudentsDialogProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [exportAll, setExportAll] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const { data: classesData, isLoading: isLoadingClasses } = useGetClasses();
  const exportMutation = useExportStudents();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedClassIds([]);
      setExportAll(false);
      setExportFormat("excel");
    }
  }, [open]);

  const handleClassToggle = (classId: string) => {
    if (exportAll) {
      // If "all" is selected, deselect it first
      setExportAll(false);
    }
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const handleExportAllToggle = (checked: boolean) => {
    setExportAll(checked);
    if (checked) {
      setSelectedClassIds([]);
    }
  };

  const handleSubmit = async () => {
    // If exportAll is true, use all class IDs
    const classIds = exportAll && classesData
      ? classesData.map((c) => c.id)
      : selectedClassIds;

    await exportMutation.mutateAsync(
      { classIds, format: exportFormat },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const canSubmit = exportAll || selectedClassIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تصدير بيانات الطلاب</DialogTitle>
          <DialogDescription>
            اختر الفصول التي تريد تصدير بيانات طلابها واختر صيغة التصدير
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Class Selection */}
          <div className="space-y-3">
            <Label>اختر الفصول</Label>
            
            {/* Export All Option */}
            <div className="flex items-center space-x-2 space-x-reverse rounded-lg border p-3">
              <Checkbox
                id="export-all"
                checked={exportAll}
                onCheckedChange={handleExportAllToggle}
                disabled={isLoadingClasses || exportMutation.isPending}
              />
              <label
                htmlFor="export-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                تصدير جميع الطلاب من جميع الفصول
              </label>
            </div>

            {/* Individual Classes */}
            {!exportAll && (
              <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border p-3">
                {isLoadingClasses ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-sm text-muted-foreground">
                      جاري تحميل الفصول...
                    </span>
                  </div>
                ) : classesData && classesData.length > 0 ? (
                  classesData.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center space-x-2 space-x-reverse"
                    >
                      <Checkbox
                        id={`class-${classItem.id}`}
                        checked={selectedClassIds.includes(classItem.id)}
                        onCheckedChange={() => handleClassToggle(classItem.id)}
                        disabled={exportMutation.isPending}
                      />
                      <label
                        htmlFor={`class-${classItem.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {classItem.name} ({classItem.numberOfStudents} طالب)
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    لا توجد فصول متاحة
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label>صيغة التصدير</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat("excel")}
                disabled={exportMutation.isPending}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent",
                  exportFormat === "excel"
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Excel</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat("pdf")}
                disabled={exportMutation.isPending}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent",
                  exportFormat === "pdf"
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">PDF</span>
              </button>
            </div>
          </div>

          {/* Error Display */}
          {exportMutation.error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <div className="flex-1 text-sm text-destructive">
                حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exportMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

