import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImportStudents } from "@/hooks/use-students";
import { getFieldErrors } from "@/lib/api";

import { Label } from "../ui/label";

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7 MB
const ALLOWED_EXTENSIONS = [".csv", ".xlsx"];

export function ImportStudentsDialog({
  open,
  onOpenChange,
}: ImportStudentsDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportStudents();

  const error = importMutation.error;
  const fileErrors = getFieldErrors(error, "file");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file extension
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    await importMutation.mutateAsync(selectedFile, {
      onSuccess: () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    if (!importMutation.isPending) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>استيراد الطلاب من ملف Excel</DialogTitle>
          <DialogDescription>
            قم برفع ملف Excel (.csv أو .xlsx) بحد أقصى 7 ميجابايت
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file">اختر الملف</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={importMutation.isPending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
                className="flex-1"
              >
                <Upload className="h-4 w-4 ml-2" />
                اختر ملف
              </Button>
            </div>

            {/* Selected File Display */}
            {selectedFile && (
              <div className="flex items-center gap-2 rounded-lg border p-3 bg-accent/50">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={importMutation.isPending}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* File Errors */}
            {fileErrors.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  {fileErrors.map((err, idx) => (
                    <span key={idx}>{err}</span>
                  ))}
                </div>
              </div>
            )}

            {/* File Requirements */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• الصيغ المدعومة: CSV, XLSX</p>
              <p>• الحد الأقصى لحجم الملف: 7 ميجابايت</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={importMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الاستيراد...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 ml-2" />
                استيراد
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
