import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { GradePaperUpload } from "@/components/grading/GradePaperUpload";
import { GradedExamResult } from "@/components/grading/GradedExamResult";
import { CameraScanner } from "@/components/grading/CameraScanner";
import { XCircle, X } from "lucide-react";

import { toast } from "sonner";
import { useProcessExam } from "@/hooks/use-grading";
import type { ExamResult } from "@/types/grading";

const Grading = () => {
  const [gradedResults, setGradedResults] = useState<ExamResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processExamMutation = useProcessExam();
  const isLoading = processExamMutation.isPending;
  const [showCamera, setShowCamera] = useState(false);

  const handleUpload = async (file: File) => {
    setError(null);
    setGradedResults(null);

    try {
      const data = await processExamMutation.mutateAsync(file);

      if (data.results && data.results.length > 0) {
        setGradedResults(data.results);
      } else {
        throw new Error("لا توجد نتائج في الاستجابة");
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || "حدث خطأ غير معروف";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleCameraResults = (results: ExamResult[]) => {
    setGradedResults(results);
    setShowCamera(false);
  };

  const portraitConstraints = {
    facingMode: "environment",
    aspectRatio: 9 / 16,
    width: { ideal: 720 },
    height: { ideal: 1280 }
  };

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-8 p-6 bg-gradient-to-br from-slate-50/50 to-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
              التصحيح والنتائج
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              تصحيح أوراق الاختبارات باستخدام الذكاء الاصطناعي وعرض النتائج
            </p>
          </div>
          {/* <Button
            onClick={() => setShowCamera(true)}
            className="bg-primary text-white shadow-md"
          >
            <Camera className="ml-2 h-4 w-4" />
            فتح الكاميرا
          </Button> */}
        </div>

        <GradePaperUpload
          onUpload={handleUpload}
          isLoading={isLoading}
          onCameraResults={handleCameraResults}
        />

        {error && (
          <div className="bg-destructive/15 text-destructive px-5 py-4 rounded-xl border border-destructive/30 flex items-center gap-3 shadow-sm">
            <div className="p-1 bg-destructive/20 rounded-full">
              <XCircle className="h-5 w-5" />
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {gradedResults && (
          <GradedExamResult
            results={gradedResults}
            onNewCorrection={() => setGradedResults(null)}
            onUpdateModel={() => alert("تحديث النموذج - قيد التطوير")}
          />
        )}

        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black">
            <button
              onClick={() => setShowCamera(false)}
              className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-6 w-6" />
            </button>

            <CameraScanner
              fullscreen={true}
              onComplete={handleCameraResults}
              videoConstraints={portraitConstraints}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Grading;
