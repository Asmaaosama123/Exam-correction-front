import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { GradePaperUpload } from "@/components/grading/GradePaperUpload";
import { GradedExamResult } from "@/components/grading/GradedExamResult";
import { GradingResultsTable } from "@/components/grading/GradingResultsTable";
import { XCircle, Upload, CheckCircle2, Camera, FileText, AlertTriangle } from "lucide-react";
import { HelpFab } from "@/components/ui/help-fab";
import { toast } from "sonner";
import { useProcessExam } from "@/hooks/use-grading";
import { getErrorMessage } from "@/lib/api";
import type { ExamResult } from "@/types/grading";
import { useAuth } from "@/hooks/use-auth";

const Grading = () => {
  const { data: user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlExamId = searchParams.get("examId");
  const urlTemplateId = searchParams.get("templateId");

  const [gradedResults, setGradedResults] = useState<ExamResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processExamMutation = useProcessExam();
  const isLoading = processExamMutation.isPending;

  const handleUpload = async (file: File, templateId?: number) => {
    setError(null);
    setGradedResults(null);

    try {
      const data = await processExamMutation.mutateAsync({ file, templateId });

      if (data && data.results && data.results.length > 0) {
        setGradedResults(data.results);
      } else {
        throw new Error("لم يتم العثور على نتائج في الاستجابة. يرجى مراجعة ملف الإدخال.");
      }
    } catch (err: any) {
      console.error("Grading upload error:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setGradedResults(null); // Clear potential stale results
      toast.error(errorMessage);
    }
  };


  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 sm:gap-8 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
              {urlExamId ? "التصحيح بدون باركود" : "التصحيح والنتائج"}
            </h1>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg max-w-2xl">
              نظام التصحيح الذكي: ارفع أوراق الاختبار ودع الذكاء الاصطناعي يقوم بالباقي مع إمكانية المراجعة اليدوية بدقة عالية.
            </p>
          </div>
        </div>

        {/* Quota Alerts */}
        {user && user.isSubscriptionModeEnabled !== false && user.maxAllowedPages > 0 && user.usedPages >= user.maxAllowedPages && user.isSubscribed && (
          <div className="bg-destructive/15 text-destructive px-5 py-4 rounded-xl border border-destructive/30 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-destructive/20 rounded-full">
                <XCircle className="h-5 w-5" />
              </div>
              <span className="font-medium">لقد استنفدت رصيد الباقة الخاصة بك ({user.maxAllowedPages} ورقة).</span>
            </div>
            <a href="/teacher/plans" className="text-sm font-bold underline hover:text-destructive/80">تجديد الباقة</a>
          </div>
        )}

        {user && user.isSubscriptionModeEnabled !== false && user.maxAllowedPages > 0 && (user.usedPages / user.maxAllowedPages) > 0.9 && user.usedPages < user.maxAllowedPages && user.isSubscribed && (
          <div className="bg-orange-500/15 text-orange-600 px-5 py-4 rounded-xl border border-orange-500/30 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-orange-500/20 rounded-full">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="font-medium">رصيدك يوشك على النفاذ! المتبقي {user.maxAllowedPages - user.usedPages} ورقة فقط.</span>
            </div>
            <a href="/teacher/plans" className="text-sm font-bold underline hover:text-orange-700">ترقية الباقة</a>
          </div>
        )}

        <GradePaperUpload
          onUpload={handleUpload}
          isLoading={isLoading}
          initialTemplateId={urlExamId ? parseInt(urlExamId) : (urlTemplateId ? parseInt(urlTemplateId) : undefined)}
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
            onUpdate={() => setGradedResults(null)}
          />
        )}

        {/* زر المساعدة الثابت باستخدام المكون الموحد */}
        <HelpFab
          title="كيفية استخدام صفحة التصحيح"
          description="دليل سريع لتصحيح أوراق الاختبارات"
          tooltip="دليل استخدام صفحة التصحيح"
        >
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              يمكنك تصحيح أوراق إجابات الطلاب تلقائياً باستخدام الذكاء الاصطناعي. اتبع الخطوات التالية:
            </p>

            <div className="space-y-4">
              {/* خطوة 1: اختيار الملف */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">1. رفع ورقة الإجابة</h4>
                  <p className="text-sm text-muted-foreground">
                    قم برفع ملف <strong>PDF</strong> أو صورة (JPG, PNG) تحتوي على ورقة إجابة الطالب الممسوحة ضوئياً. تأكد من أن الصورة واضحة وأن العلامات (المربعات السوداء) في الزوايا ظاهرة.
                  </p>
                </div>
              </div>

              {/* خطوة 2: الكاميرا */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">2. استخدام الكاميرا</h4>
                  <p className="text-sm text-muted-foreground">
                    بدلاً من الرفع، يمكنك استخدام زر <strong>"استخدام الكاميرا"</strong> لفتح تطبيق الكاميرا الأصلي على جهازك والتقاط صور لأوراق الطلاب مباشرة.
                  </p>
                </div>
              </div>

              {/* خطوة 3: النتائج */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">3. مراجعة النتائج</h4>
                  <p className="text-sm text-muted-foreground">
                    بعد التصحيح، ستظهر النتيجة والدرجة واسم الطالب (إذا تم التعرف عليه). يمكنك مراجعة تفاصيل كل سؤال (صح/خطأ) بالضغط على زر التفاصيل.
                  </p>
                </div>
              </div>

              {/* خطوة 4: النموذج */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">4. عرض الوثيقة</h4>
                  <p className="text-sm text-muted-foreground">
                    يمكنك مشاهدة الورقة المصححة مع العلامات التوضيحية (التي تبين الإجابات الصحيحة والخاطئة) بالضغط على زر <strong>"عرض الوثيقة"</strong>.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground border-t pt-4 mt-2">
              💡 <strong>نصيحة:</strong> للحصول على أفضل النتائج، تأكد من مسح الورقة ضوئياً بشكل مسطح وإضاءة جيدة.
            </p>
          </div>
        </HelpFab>

        <div className="mt-8">
          <GradingResultsTable />
        </div>
      </div>
    </MainLayout>
  );
};

export default Grading;
