import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import * as Tabs from "@radix-ui/react-tabs"; // ✅ direct import from Radix UI – eliminates all prop errors
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GradedExamResult } from "./GradedExamResult";

// تعريف الأنواع محلياً
interface GradingDetail {
  id: string;
  type: "mcq" | "true_false";
  gt: string;
  pred: string;
  conf: number;
  ok: boolean;
  method: string;
}

interface ExamResult {
  filename: string;
  details: {
    score: number;
    total: number;
    details: GradingDetail[];
  };
  annotated_image_url: string;
}

const API_BASE_URL = "http://76.13.51.15:5002";

interface CameraScannerProps {
  onComplete?: (results: ExamResult[]) => void;
  initialResults?: ExamResult[];
  fullscreen?: boolean;
}

export function CameraScanner({
  onComplete,
  initialResults = [],
  fullscreen = false,
}: CameraScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImages, setCapturedImages] = useState<{ id: string; src: string; file: File }[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<ExamResult[]>(initialResults);
  const [activeTab, setActiveTab] = useState<"camera" | "results">(
    initialResults.length > 0 ? "results" : "camera"
  );

  useEffect(() => {
    const enableCamera = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        toast.error("لم نتمكن من الوصول إلى الكاميرا، تأكد من الصلاحيات");
        setIsCameraActive(false);
      }
    };
    enableCamera();
  }, []);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error("فشل التقاط الصورة، تأكد من الكاميرا");
      return;
    }

    const blob = dataURLtoBlob(imageSrc);
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });

    setCapturedImages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), src: imageSrc, file },
    ]);
    toast.success("تم التقاط الصورة");
  }, [webcamRef]);

  const dataURLtoBlob = (dataURL: string) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const removeImage = (id: string) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const uploadAll = async () => {
    if (capturedImages.length === 0) {
      toast.error("لا توجد صور للتصحيح");
      return;
    }

    setIsUploading(true);
    setActiveTab("results");

    const allResults: ExamResult[] = [...results];

    for (const [index, img] of capturedImages.entries()) {
      toast.info(`جاري تصحيح الصورة ${index + 1} من ${capturedImages.length}...`);

      const formData = new FormData();
      formData.append("file", img.file);

      try {
        const response = await fetch(`${API_BASE_URL}/api/Exam/process`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`فشل التصحيح: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
          allResults.push(...data.results);
          setResults([...allResults]);
        }
      } catch (error) {
        toast.error(`فشل في تصحيح الصورة ${index + 1}: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
      }
    }

    setIsUploading(false);
    if (allResults.length > results.length) {
      toast.success(`تم تصحيح ${allResults.length - results.length} طالب بنجاح`);
      onComplete?.(allResults);
    }
  };

  const resetCapture = () => {
    setCapturedImages([]);
    setResults([]);
    setActiveTab("camera");
  };

  return (
    <Card className={`border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50/80 ${
      fullscreen ? "w-full h-full" : ""
    }`}>
      <CardHeader className="border-b border-slate-100 bg-white/50 backdrop-blur-sm py-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          مسح أوراق الاختبار بالكاميرا
        </CardTitle>
        <CardDescription className="text-sm">
          التقط صوراً لورقة الإجابة وسيقوم النظام بتصحيحها تلقائياً
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5">
        {/* Radix UI Tabs – no more TypeScript errors on value/onValueChange */}
        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "camera" | "results")}
          className="space-y-5"
        >
          <Tabs.List className="grid w-full grid-cols-2 h-12 p-1 bg-slate-100 rounded-lg">
            <Tabs.Trigger
              value="camera"
              className="text-sm data-[state=active]:bg-white data-[state=active]:shadow rounded-md px-4 py-2 flex items-center justify-center gap-2"
            >
              <Camera className="h-4 w-4" />
              التقاط الصور
            </Tabs.Trigger>
            <Tabs.Trigger
              value="results"
              className="text-sm data-[state=active]:bg-white data-[state=active]:shadow rounded-md px-4 py-2 flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              النتائج ({results.length})
            </Tabs.Trigger>
          </Tabs.List>

          {/* تبويب الكاميرا */}
          <Tabs.Content value="camera" className="space-y-5">
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-black/5 aspect-video">
              {isCameraActive ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-slate-200">
                  <Camera className="h-12 w-12 text-slate-400" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={capture}
                size="default"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md"
                disabled={!isCameraActive}
              >
                <Camera className="ml-2 h-4 w-4" />
                التقاط صورة
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className="border-2"
              >
                {isCameraActive ? "إيقاف" : "تشغيل"}
              </Button>
            </div>

            {capturedImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-semibold flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
                      {capturedImages.length}
                    </Badge>
                    صورة ملتقطة
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetCapture}>
                    <X className="h-4 w-4 ml-1" /> مسح الكل
                  </Button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {capturedImages.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img src={img.src} alt="capture" className="w-full h-20 object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(img.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={uploadAll}
                  disabled={isUploading || capturedImages.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-md mt-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التصحيح...
                    </>
                  ) : (
                    <>
                      <Upload className="ml-2 h-4 w-4" />
                      تصحيح {capturedImages.length} صورة
                    </>
                  )}
                </Button>
              </div>
            )}
          </Tabs.Content>

          {/* تبويب النتائج */}
          <Tabs.Content value="results" className="space-y-5">
            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-md font-medium text-muted-foreground">
                  جاري التصحيح... {results.length} من {capturedImages.length}
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <GradedExamResult 
                  results={results} 
                  onNewCorrection={resetCapture}
                  onUpdateModel={() => alert("تحديث النموذج - قيد التطوير")}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Camera className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-md font-medium text-muted-foreground">
                  لا توجد نتائج بعد
                </p>
                <Button variant="link" onClick={() => setActiveTab("camera")} className="mt-1">
                  العودة لالتقاط الصور
                </Button>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </CardContent>
    </Card>
  );
}