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
import { useExportClasses } from "@/hooks/use-classes";
import { cn } from "@/lib/utils";

interface ExportClassesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportClassesDialog({
  open,
  onOpenChange,
}: ExportClassesDialogProps) {
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("excel");
  const exportMutation = useExportClasses();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setExportFormat("excel");
    }
  }, [open]);

  const handleSubmit = async () => {
    await exportMutation.mutateAsync(exportFormat, {
      onSuccess: () => {
        // Track download
        const downloads = localStorage.getItem("downloads");
        if (downloads) {
          const downloadsObj = JSON.parse(downloads);
          downloadsObj["تصدير الفصول"] = (downloadsObj["تصدير الفصول"] || 0) + 1;
          localStorage.setItem("downloads", JSON.stringify(downloadsObj));
        } else {
          localStorage.setItem("downloads", JSON.stringify({ "تصدير الفصول": 1 }));
        }
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تصدير بيانات الفصول</DialogTitle>
          <DialogDescription>
            اختر صيغة التصدير لتصدير جميع الفصول
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
            disabled={exportMutation.isPending}
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

