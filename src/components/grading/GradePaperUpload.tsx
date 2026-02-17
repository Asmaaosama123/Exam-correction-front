import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { ExamResult } from "@/types/grading";

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

interface GradePaperUploadProps {
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  onCameraResults?: (results: ExamResult[]) => void;
}

export function GradePaperUpload({
  onUpload,
  isLoading,
}: GradePaperUploadProps) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stitchImages = async (files: File[]): Promise<{ url: string, width: number, height: number, file: File }> => {
    return new Promise((resolve, reject) => {
      const images: HTMLImageElement[] = [];
      let loadedCount = 0;

      files.forEach((file, index) => {
        const img = new Image();
        img.onload = () => {
          images[index] = img;
          loadedCount++;
          if (loadedCount === files.length) {
            const maxWidth = Math.max(...images.map(i => i.width));
            const totalHeight = images.reduce((sum, i) => sum + i.height, 0);

            const canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            let currentY = 0;
            images.forEach(img => {
              ctx.drawImage(img, 0, currentY);
              currentY += img.height;
            });

            canvas.toBlob((blob) => {
              if (blob) {
                const stitchedFile = new File([blob], "stitched_grading_images.png", { type: "image/png" });
                resolve({ url: URL.createObjectURL(blob), width: maxWidth, height: totalHeight, file: stitchedFile });
              } else {
                reject(new Error("Failed to create blob"));
              }
            }, "image/png");
          }
        };
        img.onerror = () => reject(new Error(`Failed to load image ${file.name}`));
        img.src = URL.createObjectURL(file);
      });
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | File | File[]) => {
    let files: File[] = [];

    if (Array.isArray(e)) {
      files = e;
    } else if (e instanceof File) {
      files = [e];
    } else {
      files = Array.from(e.target.files || []);
    }

    if (files.length === 0) return;

    const hasPdf = files.some(f => f.name.toLowerCase().endsWith('.pdf'));
    if (hasPdf && files.length > 1) {
      toast.error("لا يمكن رفع أكثر من ملف PDF واحد");
      return;
    }

    const invalidFiles = files.filter(f => !ACCEPTED_TYPES.includes(f.type) && !f.name.toLowerCase().endsWith('.pdf'));
    if (invalidFiles.length > 0) {
      toast.error("بعض الملفات غير مدعومة. يرجى اختيار PDF أو صور فقط.");
      return;
    }

    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(files[0]);
    } else {
      try {
        const { file } = await stitchImages(files);
        setSelectedFile(file);
      } catch (err) {
        toast.error("حدث خطأ أثناء معالجة الصور");
        console.error(err);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e);
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
    if (file) handleFileSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGrade = async () => {
    if (!selectedFile) {
      toast.error("يرجى اختيار ملف للتصحيح");
      return;
    }
    await onUpload(selectedFile);
    handleRemoveFile();
  };

  // فتح الكاميرا باستخدام input native
  const handleCameraScan = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-slate-50/80">
      <CardHeader className="border-b border-slate-100 bg-white/50 backdrop-blur-sm">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          تصحيح ورقة اختبار
        </CardTitle>
        <CardDescription className="text-base">
          ارفع ورقة الاختبار الممسوحة ضوئياً أو استخدم الكاميرا لتصحيحها
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* رفع الملفات */}
        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragActive
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
              }`}
            onClick={() => !isLoading && fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="mb-2 text-lg font-medium">
                <span className="font-bold text-primary">انقر للرفع</span> أو اسحب الملف هنا
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, JPG, PNG, WebP, GIF
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ACCEPT_ATTR}
              onChange={handleFileInputChange}
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                disabled={isLoading}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Button
              onClick={handleGrade}
              disabled={isLoading}
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري التصحيح...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                  تصحيح الورقة
                </>
              )}
            </Button>
          </div>
        )}

        <div className="relative pt-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-dashed border-slate-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-4 text-sm text-muted-foreground">أو</span>
          </div>
        </div>

        {/* زر الكاميرا - يفتح في نفس الصفحة */}
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-4 border-2 hover:bg-slate-100 transition-all"
          onClick={handleCameraScan}
        >
          <div className="p-2 bg-primary/10 rounded-lg">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col items-start text-right">
            <span className="text-base font-medium">
              استخدام الكاميرا
            </span>
            <span className="text-xs text-muted-foreground">
              التقاط صورة مباشرة من كاميرا الجهاز
            </span>
          </div>
        </Button>

        {/* Hidden Camera Input */}
        <input
          ref={cameraInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleCameraInputChange}
          disabled={isLoading}
        />
      </CardContent>
    </Card>
  );
}