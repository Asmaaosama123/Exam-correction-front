import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, BookOpen, ChevronLeft } from "lucide-react";

interface GradingDetail {
  id: string;
  type: "mcq" | "true_false";
  gt: string;
  pred: string;
  ok: boolean;
  points: number; // ✅ الجديد
}

interface StudentDetailsModalProps {
  studentName: string;
  details: GradingDetail[];
  score: number;
  total: number;
}

// ترجمة الإجابات للعربية
const translateAnswer = (value: string, type: string): string => {
  if (value === "None") return "متروك";
  if (type === "mcq") {
    const map: Record<string, string> = { A: "أ", B: "ب", C: "ج", D: "د" };
    return map[value] || value;
  }
  if (type === "true_false") {
    return value === "TRUE" ? "صحيح" : "خطأ";
  }
  return value;
};

const getTypeLabel = (type: string) => {
  return type === "mcq" ? "اختيار من متعدد" : "صح/خطأ";
};

export function StudentDetailsModal({
  studentName,
  details,
  score,
  total,
}: StudentDetailsModalProps) {
  const percentage = ((score / total) * 100).toFixed(1);
  const isPassing = (score / total) >= 0.6;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="text-primary p-0 h-auto font-medium hover:no-underline group"
        >
          عرض التفصيل
          <ChevronLeft className="h-3 w-3 mr-1 transition-transform group-hover:-translate-x-0.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-full md:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl border shadow-2xl p-0 overflow-x-hidden">
        <DialogTitle className="sr-only">تفاصيل نتيجة الطالب {studentName}</DialogTitle>
        <div className="bg-card p-4 sm:p-6">
          <div className={`p-4 sm:p-6 -m-4 sm:-m-6 mb-4 sm:mb-6 rounded-t-xl sm:rounded-t-2xl border-b ${isPassing
            ? "bg-emerald-500/5 border-emerald-500/10"
            : "bg-rose-500/5 border-rose-500/10"
            }`}>
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-3xl font-bold flex items-center gap-2 overflow-hidden">
                  <span className="bg-primary/10 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0">
                    <BookOpen className="h-4 w-4 sm:h-6 text-primary" />
                  </span>
                  <span className="truncate max-w-[150px] sm:max-w-none">الطالب: {studentName}</span>
                </h2>

                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  درجة التصحيح: <span className="font-bold text-foreground">{score}</span> من {total}
                </p>
              </div>
              <div className="mt-2 sm:mt-0">
                <div className={`px-4 py-2 rounded-full text-lg font-bold shadow-sm ${isPassing
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-800"
                  }`}>
                  {percentage}%
                </div>
              </div>
            </div>
          </div>

          {/* جدول التفاصيل */}
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="text-right p-2 sm:p-4 text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase w-8 sm:w-12">#</th>
                  <th className="text-right p-2 sm:p-4 text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase hidden md:table-cell">النوع</th>
                  <th className="text-right p-2 sm:p-4 text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase">الإجابة الصحيحة</th>
                  <th className="text-right p-2 sm:p-4 text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase">إجابة الطالب</th>
                  <th className="text-right p-2 sm:p-4 text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase hidden sm:table-cell">الدرجة</th>
                  <th className="text-right p-2 sm:p-4 text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase">النتيجة</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, idx) => (
                  <tr
                    key={detail.id}
                    className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? "bg-card" : "bg-muted/30"
                      }`}
                  >
                    <td className="p-2 sm:p-4 font-mono text-[11px] sm:text-sm">{detail.id}</td>
                    <td className="p-2 sm:p-4 hidden md:table-cell">
                      <Badge variant="outline" className="font-normal border-border bg-muted">
                        {getTypeLabel(detail.type)}
                      </Badge>
                    </td>
                    <td className="p-2 sm:p-4 font-medium text-xs sm:text-sm">
                      {translateAnswer(detail.gt, detail.type)}
                    </td>
                    <td className="p-2 sm:p-4">
                      <span className={
                        detail.pred === "None"
                          ? "text-muted-foreground italic bg-muted px-1.5 py-0.5 rounded text-[10px] sm:text-sm"
                          : "font-medium text-xs sm:text-sm"
                      }>
                        {translateAnswer(detail.pred, detail.type)}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-primary hidden sm:table-cell">
                      {detail.points} درجة
                    </td>
                    <td className="p-2 sm:p-4">
                      {(() => {
                        const isCorrect = detail.ok || (detail.pred && detail.gt && detail.pred.trim().toLowerCase() === detail.gt.trim().toLowerCase());
                        return isCorrect ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800 gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 hover:bg-emerald-100 text-[9px] sm:text-sm flex w-max items-center">
                            <CheckCircle className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" /> صحيحة
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-800 hover:bg-rose-200 text-[9px] sm:text-sm flex w-max items-center">
                            <XCircle className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" /> خاطئة
                          </Badge>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ملخص سريع */}
          <div className="mt-6 flex flex-wrap gap-4 justify-between items-center p-4 bg-muted/50 rounded-xl border">
            <span className="text-sm text-muted-foreground">
              عدد الأسئلة: <strong className="text-foreground">{details.length}</strong>
            </span>
            <span className="text-sm text-muted-foreground">
              الإجابات الصحيحة: <strong className="text-emerald-600 dark:text-emerald-400">{details.filter(d => d.ok).length}</strong>
            </span>
            <span className="text-sm text-muted-foreground">
              الإجابات الخاطئة: <strong className="text-rose-600 dark:text-rose-400">{details.filter(d => !d.ok).length}</strong>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}