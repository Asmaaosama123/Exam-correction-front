import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGradePaper } from "@/hooks/use-grading";
import { toast } from "sonner";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ACCEPT_ATTR =
  "application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/gif";

export function GradePaperUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gradeMutation = useGradePaper();

  const handleFileSelect = (file: File) => {
    if (file && ACCEPTED_TYPES.includes(file.type)) {
      setSelectedFile(file);
    } else {
      toast.error("يرجى اختيار ملف PDF أو صورة (JPG, PNG, WebP, GIF)");
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGrade = async () => {
    if (!selectedFile) {
      toast.error("يرجى اختيار ملف (PDF أو صورة) للتصحيح");
      return;
    }

    gradeMutation.mutate(
      { file: selectedFile },
      {
        onSuccess: () => {
          // Reset file after successful grading
          handleRemoveFile();
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تصحيح ورقة اختبار</CardTitle>
        <CardDescription>
          ارفع ورقة الاختبار الممسوحة ضوئياً وسيقوم النظام بقراءة الباركود
          وتصحيح الورقة تلقائياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:bg-muted/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">انقر للرفع</span> أو اسحب الملف
                هنا
              </p>
              <p className="text-xs text-muted-foreground">PDF أو صورة (JPG, PNG, WebP, GIF)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPT_ATTR}
              onChange={handleFileInputChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={gradeMutation.isPending}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={handleGrade}
              disabled={gradeMutation.isPending}
              className="w-full"
              size="lg"
            >
              {gradeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التصحيح...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  تصحيح الورقة
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
