import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { GradePaperUpload } from "@/components/grading/GradePaperUpload";
import { GradedExamResult } from "@/components/grading/GradedExamResult";
import { GradingResultsTable } from "@/components/grading/GradingResultsTable";
// src/types/grading.ts
import { XCircle } from "lucide-react";

export interface GradingDetail {
  id: string;
  type: "mcq" | "true_false";
  gt: string;
  pred: string;
  conf: number;
  ok: boolean;
  method: string;
}

export interface ExamResult {
  filename: string;
  details: {
    score: number;
    total: number;
    details: GradingDetail[];
  };
  annotated_image_url: string;
}
const Grading = () => {
  const [gradedResults, setGradedResults] = useState<ExamResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setGradedResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://76.13.51.15:5002/api/Exam/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`فشل التصحيح: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setGradedResults(data.results);
      } else {
        throw new Error("لا توجد نتائج في الاستجابة");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير معروف");
    } finally {
      setIsLoading(false);
    }
  };

  // استقبال نتائج الكاميرا
  const handleCameraResults = (results: ExamResult[]) => {
    setGradedResults(results);
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

        <GradingResultsTable />
      </div>
    </MainLayout>
  );
};

export default Grading;