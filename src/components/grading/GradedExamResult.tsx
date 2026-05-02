import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentDetailsModal } from "./StudentDetailsModal";
import { ManualGradingModal } from "./ManualGradingModal";
import {
  FileCheck, RotateCw, Users, Award,
  FileImage, ExternalLink, AlertCircle
} from "lucide-react";
import type { GradingDetail, ExamResult } from "@/types/grading";

interface GradedExamResultProps {
  results: ExamResult[];
  onNewCorrection?: () => void;
  onUpdateModel?: () => void;
  onUpdate?: () => void;
}

export function GradedExamResult({
  results,
  onNewCorrection,
  onUpdateModel,
  onUpdate
}: GradedExamResultProps) {
  const [reviewingPaper, setReviewingPaper] = useState<{
    id: string | number;
    studentName: string;
    details: GradingDetail[];
    annotatedImageUrl?: string;
  } | null>(null);

  const extractStudentNumber = (filename: string): string => {
    const match = filename.match(/\(Student:\s*(\d+)\)/);
    return match ? match[1] : "غير معروف";
  };

  const handleNewCorrection = () => {
    if (onNewCorrection) onNewCorrection();
    else window.location.reload();
  };

  const handleUpdateModel = () => {
    if (onUpdateModel) onUpdateModel();
    else alert("تحديث النموذج - سيتم تفعيله قريباً");
  };

  // إحصائيات عامة
  const totalStudents = results.length;
  const totalScore = results.reduce((acc, r) => acc + (r.details?.score || 0), 0);
  const totalPossible = results.reduce((acc, r) => acc + (r.details?.total || 0), 0);
  const avgPercentage = totalPossible ? ((totalScore / totalPossible) * 100).toFixed(1) : "0";

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden bg-card dark:border dark:border-border">
      {/* Header مع خلفية متدرجة */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/5" />
        <CardHeader className="relative pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-3 dark:text-slate-100">
                <span className="bg-primary/10 p-2 sm:p-2.5 rounded-2xl shadow-sm">
                  <Users className="h-6 w-6 sm:h-7 sm:h-7 text-primary" />
                </span>
                تثبيت تصحيح الدفعة
              </CardTitle>
              <div className="text-muted-foreground mt-2 text-sm sm:text-base flex flex-wrap items-center gap-x-4 gap-y-2 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  <span>تم تصحيح <span className="font-bold text-foreground">{totalStudents}</span> طالب</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>متوسط الدرجات <span className="font-bold text-foreground font-mono">{avgPercentage}%</span></span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm px-4 py-2 border-primary/20 shadow-sm">
                إجمالي الدرجات: {totalScore} / {totalPossible}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="space-y-6">
        {/* الجدول العصري - كروت للطلاب بدلاً من جدول تقليدي (لمسة كريتف) */}
        <div className="grid grid-cols-1 gap-4">
          {results.map((result, index) => {
            const studentNumber = result.student_info?.student_id || extractStudentNumber(result.filename);
            const score = result.details?.score || 0;
            const total = result.details?.total || 1;
            const details = result.details?.details || [];
            const percentage = ((score / total) * 100).toFixed(1);
            const isPassing = (score / total) >= 0.6;

            return (
              <div
                key={result.filename}
                className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${isPassing
                  ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400"
                  : "bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-800/50 hover:border-amber-400"
                  }`}
              >
                {/* شريط جانبي لوني */}
                <div className={`absolute right-0 top-0 bottom-0 w-2 rounded-r-2xl ${isPassing ? "bg-emerald-500" : "bg-amber-500"
                  }`} />

                <div className="flex flex-wrap items-center justify-between gap-4 mr-4">
                  {/* بيانات الطالب */}
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center text-base sm:text-lg font-bold shadow-sm ${!result.student_info?.student_name || result.student_info?.student_name?.includes("غير معروف") || result.student_info?.student_name?.includes("مجهول")
                      ? "bg-slate-100 text-slate-400 border border-slate-200"
                      : isPassing
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800"
                      }`}>
                      {(!result.student_info?.student_name || result.student_info?.student_name?.includes("غير معروف") || result.student_info?.student_name?.includes("مجهول")) ? (
                        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        studentNumber
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                          {(!result.student_info?.student_name || result.student_info?.student_name?.includes("غير معروف") || result.student_info?.student_name?.includes("مجهول"))
                            ? `طالب مجهول ${index + 1}`
                            : result.student_info?.student_name}
                        {(!result.student_info?.student_name || result.student_info?.student_name?.includes("غير معروف") || result.student_info?.student_name?.includes("مجهول")) && (
                          <Badge variant="outline" className="bg-white/50 text-[10px] py-0 px-1.5 border-slate-200 text-slate-400 h-5">بانتظار التعريف</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground font-medium">
                        <span className="whitespace-nowrap">الدرجة: <strong className="text-foreground">{score}</strong> / {total}</span>
                        <span className="hidden sm:inline opacity-30">•</span>
                        <span className="whitespace-nowrap">النسبة: <strong className={isPassing ? "text-emerald-600" : "text-amber-600 font-bold"}>{percentage}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* الإجراءات */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="flex gap-2 w-full sm:w-auto">
                      <StudentDetailsModal
                        studentName={result.student_info?.student_name || "غير معروف"}
                        details={details.map(({ id, type, question_type, options, gt, pred, ok, points }) => ({
                          id, type, question_type, options, gt, pred, ok, points
                        }))}
                        score={score}
                        total={total}
                      />

                      {result.paper_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 px-3 font-bold"
                          onClick={() => setReviewingPaper({
                            id: result.paper_id!,
                            studentId: result.student_info?.student_id || 0,
                            studentName: result.student_info?.student_name || "غير معروف",
                            details: details,
                            annotatedImageUrl: result.annotated_image_url
                          })}
                        >
                          <AlertCircle className="w-3.5 h-3.5 ml-1.5" />
                          مراجعة وتعديل
                        </Button>
                      )}
                    </div>

                    {result.annotated_image_url && (
                      <a
                        href={(() => {
                          const annotatedImageUrl = result.annotated_image_url;
                          if (!annotatedImageUrl) return "#";
                          
                          const baseUrl = "https://examcorrection.wsyelhi.com";
                          let fullImageUrl = "";
                          let cleanPath = annotatedImageUrl.trim();

                          if (cleanPath.includes('76.13.51.15:8000')) {
                            const parts = cleanPath.split(':8000/');
                            cleanPath = parts.length > 1 ? parts[1] : cleanPath;
                          } else if (cleanPath.includes('localhost') || cleanPath.includes('127.0.0.1') || cleanPath.includes('0.0.0.0')) {
                            cleanPath = cleanPath.replace(/^https?:\/\/[^/]+\//, '');
                          }

                          cleanPath = cleanPath.replace(/^ai-results\//, '');

                          if (!cleanPath.startsWith('http')) {
                            fullImageUrl = `${baseUrl}/ai-results/${cleanPath.replace(/^\/+/, '')}`;
                          } else {
                            fullImageUrl = cleanPath;
                          }
                          
                          return fullImageUrl;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 h-9 sm:h-10 text-sm font-bold rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow w-full sm:w-auto"
                      >
                        <FileImage className="h-4 w-4" />
                        <span className="whitespace-nowrap">وثيقة التصحيح</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* أزرار التحكم السفلية - بتصميم متميز */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 mt-4 border-t border-dashed">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={handleNewCorrection}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200 px-8 h-12 font-bold rounded-xl w-full sm:w-auto"
            >
              <FileCheck className="ml-2 h-5 w-5" />
              تصحيح ورقة جديدة
            </Button>
            <Button
              onClick={handleUpdateModel}
              variant="outline"
              size="lg"
              className="border-2 hover:bg-accent/5 transition-all px-8 h-12 font-bold rounded-xl w-full sm:w-auto"
            >
              <RotateCw className="ml-2 h-5 w-5" />
              تحديث النموذج
            </Button>
          </div>
          <Badge variant="secondary" className="px-5 py-2.5 text-sm bg-slate-100 text-slate-600 font-bold rounded-lg border border-slate-200">
            إجمالي الطلاب: {totalStudents}
          </Badge>
        </div>
      </CardContent>
      {reviewingPaper && (
        <ManualGradingModal
          isOpen={!!reviewingPaper}
          onClose={() => setReviewingPaper(null)}
          paperId={reviewingPaper.id}
          studentName={reviewingPaper.studentName}
          details={reviewingPaper.details}
          annotatedImageUrl={reviewingPaper.annotatedImageUrl}
          onSuccess={() => {
            setReviewingPaper(null);
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </Card>
  );
}