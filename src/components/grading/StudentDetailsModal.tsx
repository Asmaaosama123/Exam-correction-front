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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl p-0 dark:bg-slate-950 dark:border dark:border-slate-800">
        <DialogTitle className="sr-only">تفاصيل نتيجة الطالب {studentName}</DialogTitle>
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
          {/* Header بتدرج لوني حسب النتيجة */}
          <div className={`p-6 -m-6 mb-6 rounded-t-2xl ${isPassing
            ? "bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent border-b border-emerald-200 dark:border-emerald-900/50"
            : "bg-gradient-to-r from-rose-500/10 via-rose-400/5 to-transparent border-b border-rose-200 dark:border-rose-900/50"
            }`}>
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-2 dark:text-slate-100">
                  <span className="bg-primary/10 p-2 rounded-xl dark:bg-primary/20">
                    <BookOpen className="h-6 w-6 text-primary dark:text-emerald-400" />
                  </span>
                  الطالب: {studentName}
                </h2>

                <p className="text-muted-foreground mt-1 dark:text-slate-400">
                  درجة التصحيح: <span className="font-bold text-foreground dark:text-slate-200">{score}</span> من {total}
                </p>
              </div>
              <div className="mt-2 sm:mt-0">
                <div className={`px-4 py-2 rounded-full text-lg font-bold shadow-sm ${isPassing
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                  }`}>
                  {percentage}%
                </div>
              </div>
            </div>
          </div>

          {/* جدول التفاصيل */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">#</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">النوع</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">الإجابة الصحيحة</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">إجابة الطالب</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">النتيجة</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, idx) => (
                  <tr
                    key={detail.id}
                    className={`border-b last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors dark:border-slate-800 ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/30 dark:bg-slate-800/40"
                      }`}
                  >
                    <td className="p-4 font-mono text-sm dark:text-slate-300">{detail.id}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {getTypeLabel(detail.type)}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium dark:text-slate-200">
                      {translateAnswer(detail.gt, detail.type)}
                    </td>
                    <td className="p-4">
                      <span className={
                        detail.pred === "None"
                          ? "text-muted-foreground italic bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded dark:text-slate-500"
                          : "font-medium dark:text-slate-200"
                      }>
                        {translateAnswer(detail.pred, detail.type)}
                      </span>
                    </td>
                    <td className="p-4">
                      {detail.ok ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 gap-1 px-3 py-1.5">
                          <CheckCircle className="h-3.5 w-3.5" /> صحيحة
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800 hover:bg-rose-200 dark:hover:bg-rose-900/50">
                          <XCircle className="h-3.5 w-3.5" /> خاطئة
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ملخص سريع */}
          <div className="mt-6 flex flex-wrap gap-4 justify-between items-center p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border dark:border-slate-800">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              عدد الأسئلة: <strong className="dark:text-slate-200">{details.length}</strong>
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              الإجابات الصحيحة: <strong className="text-emerald-600 dark:text-emerald-400">{details.filter(d => d.ok).length}</strong>
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              الإجابات الخاطئة: <strong className="text-rose-600 dark:text-rose-400">{details.filter(d => !d.ok).length}</strong>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}