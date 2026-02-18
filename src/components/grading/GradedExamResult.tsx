import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageModal } from "./ImageModal";
import { StudentDetailsModal } from "./StudentDetailsModal";
import { FileCheck, RefreshCw, Users, Award } from "lucide-react";

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
  student_info?: {
    student_id: string;
    student_name: string;
  };
  details: {
    score: number;
    total: number;
    details: GradingDetail[];
  };
  annotated_image_url: string;
}


interface GradedExamResultProps {
  results: ExamResult[];
  onNewCorrection?: () => void;
  onUpdateModel?: () => void;
}

export function GradedExamResult({
  results,
  onNewCorrection,
  onUpdateModel
}: GradedExamResultProps) {

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
  const totalScore = results.reduce((acc, r) => acc + r.details.score, 0);
  const totalPossible = results.reduce((acc, r) => acc + r.details.total, 0);
  const avgPercentage = totalPossible ? ((totalScore / totalPossible) * 100).toFixed(1) : "0";

  return (
    <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
      {/* Header مع خلفية متدرجة */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent" />
        <CardHeader className="relative pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <span className="bg-primary/15 p-2.5 rounded-2xl shadow-sm">
                  <Users className="h-7 w-7 text-primary" />
                </span>
                تثبيت تصحيح الدفعة
              </CardTitle>
              <p className="text-muted-foreground mt-1.5 text-base flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                تم تصحيح <span className="font-bold text-foreground">{totalStudents}</span> طالب
                <span className="mx-2">•</span>
                <Award className="h-4 w-4" />
                متوسط الدرجات <span className="font-bold text-foreground">{avgPercentage}%</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white/70 backdrop-blur-sm px-4 py-2 border-primary/30 shadow-sm">
                إجمالي الدرجات: {totalScore} / {totalPossible}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="space-y-6">
        {/* الجدول العصري - كروت للطلاب بدلاً من جدول تقليدي (لمسة كريتف) */}
        <div className="grid grid-cols-1 gap-4">
          {results.map((result) => {
            const studentNumber = extractStudentNumber(result.filename);
            const { score, total, details } = result.details;
            const percentage = ((score / total) * 100).toFixed(1);
            const isPassing = (score / total) >= 0.6;

            return (
              <div
                key={result.filename}
                className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${isPassing
                  ? "bg-gradient-to-r from-emerald-50/80 to-white border-emerald-200 hover:border-emerald-400"
                  : "bg-gradient-to-r from-amber-50/80 to-white border-amber-200 hover:border-amber-400"
                  }`}
              >
                {/* شريط جانبي لوني */}
                <div className={`absolute right-0 top-0 bottom-0 w-2 rounded-r-2xl ${isPassing ? "bg-emerald-500" : "bg-amber-500"
                  }`} />

                <div className="flex flex-wrap items-center justify-between gap-4 mr-4">
                  {/* بيانات الطالب */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm ${isPassing
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-amber-100 text-amber-700 border border-amber-300"
                      }`}>
                      {studentNumber}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        الطالب {result.student_info?.student_name || "غير معروف"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>الدرجة: <strong className="text-foreground">{score}</strong> / {total}</span>
                        <span>•</span>
                        <span>النسبة: <strong className={isPassing ? "text-emerald-600" : "text-amber-600"}>{percentage}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* الإجراءات */}
                  <div className="flex items-center gap-2">
                    <StudentDetailsModal
                      studentName={result.student_info?.student_name || "غير معروف"}
                      details={details.map(({ id, type, gt, pred, ok }) => ({
                        id, type, gt, pred, ok
                      }))}
                      score={score}
                      total={total}
                    />

                    {result.annotated_image_url && (
                      <ImageModal
                        imageUrl={result.annotated_image_url}
                        filename={result.filename}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* أزرار التحكم السفلية - بتصميم متميز */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-4 border-t border-dashed border-slate-200">
          <div className="flex gap-3">
            <Button
              onClick={handleNewCorrection}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              <FileCheck className="ml-2 h-5 w-5" />
              تصحيح ورقة جديدة
            </Button>
            <Button
              onClick={handleUpdateModel}
              variant="outline"
              size="lg"
              className="border-2 hover:bg-slate-100 px-6"
            >
              <RefreshCw className="ml-2 h-5 w-5" />
              تحديث النموذج
            </Button>
          </div>
          <Badge variant="secondary" className="px-4 py-2 text-sm bg-slate-100">
            عدد الطلاب: {totalStudents}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}