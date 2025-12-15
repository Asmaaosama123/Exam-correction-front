import { useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadExam } from "@/hooks/use-exams";
import type { UploadExamRequest } from "@/types/exams";
import { toast } from "sonner";

interface UploadExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadExamDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadExamDialogProps) {
  const [examTitle, setExamTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMutation = useUploadExam();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error("يرجى اختيار ملف PDF فقط");
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !examTitle.trim() || !subject.trim()) {
      toast.error("يرجى ملء جميع الحقول واختيار ملف PDF");
      return;
    }

    const request: UploadExamRequest = {
      title: examTitle.trim(),
      subject: subject.trim(),
      file: selectedFile,
      x: 0,
      y: 0,
    };

    uploadMutation.mutate(request, {
      onSuccess: () => {
        // Reset form on success
        setExamTitle("");
        setSubject("");
        handleRemoveFile();
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setExamTitle("");
      setSubject("");
      handleRemoveFile();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>رفع اختبار جديد</DialogTitle>
          <DialogDescription>
            ارفع ورقة الأسئلة PDF واحط المعلومات المطلوبة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exam Title */}
          <div className="space-y-2">
            <Label htmlFor="examTitle">اسم الاختبار *</Label>
            <Input
              id="examTitle"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="مثال: اختبار الفصل الأول"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">المادة *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: الرياضيات"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>ورقة الأسئلة (PDF) *</Label>
            {!selectedFile ? (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">انقر للرفع</span> أو اسحب
                      الملف هنا
                    </p>
                    <p className="text-xs text-muted-foreground">PDF فقط</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {selectedFile.name}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              uploadMutation.isPending ||
              !selectedFile ||
              !examTitle.trim() ||
              !subject.trim()
            }
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                رفع الاختبار
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
