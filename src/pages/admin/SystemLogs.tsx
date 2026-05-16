import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Activity,
  Server,
  Clock,
  RefreshCcw,
  Bug
} from "lucide-react";
import {
  useGetErrorSummary,
  useGetErrorDetails,
  useResolveError,
  type ErrorSummary,
} from "@/hooks/use-system-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCircle } from "lucide-react";

function formatDate(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: arSA });
  } catch {
    return dateStr;
  }
}

export default function SystemLogs() {
  const { data: summary, isLoading, refetch, isFetching } = useGetErrorSummary();
  const activeErrorsCount = summary?.length || 0;
  const totalOccurrences = summary?.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const [selectedError, setSelectedError] = useState<ErrorSummary | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="w-8 h-8 text-cyan-600" />
              مراقبة صحة النظام
            </h1>
            <p className="text-muted-foreground mt-1">تتبع الأخطاء التقنية، المشاكل البرمجية، وفشل العمليات وسجلات التطبيق</p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 shrink-0 bg-white"
          >
            <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            تحديث السجلات
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Server className="w-4 h-4" />
                حالة السيرفرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {activeErrorsCount > 5 ? (
                  <span className="text-amber-600">تحذير</span>
                ) : activeErrorsCount > 10 ? (
                  <span className="text-rose-600">حرج</span>
                ) : (
                  <span className="text-emerald-600">مستقر</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">يعتمد على كمية الأخطاء النشطة حالياً</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                أنواع الأخطاء النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{activeErrorsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">المشاكل التي لم يتم حلها بعد</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-500" />
                مجموع التكرارات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{totalOccurrences}</div>
              <p className="text-xs text-muted-foreground mt-1">إجمالي الحدوث الكلي للأخطاء المعلقة</p>
            </CardContent>
          </Card>
        </div>

        {/* Error List */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">سجل الأخطاء المتكررة</CardTitle>
            <CardDescription>هذه القائمة مجمعة ذكياً لاختصار وعرض الأخطاء المتشابهة لتسهيل حلها.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <RefreshCcw className="w-8 h-8 animate-spin text-slate-300 mb-4" />
                جاري جلب السجلات...
              </div>
            ) : !summary || summary.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center border-b last:border-0 border-dashed border-slate-200 m-4 rounded-xl">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl text-slate-700">النظام يعمل بصحة ممتازة</h3>
                <p className="mt-2 text-slate-500">لا توجد أية أخطاء معلقة في الوقت الحالي.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {summary.map((err) => (
                  <ErrorGroupRow
                    key={err.errorMessage}
                    errorGroup={err}
                    onClick={() => setSelectedError(err)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User List Modal */}
        <Dialog open={!!selectedError} onOpenChange={(open) => !open && setSelectedError(null)}>
          <DialogContent className="max-w-md p-6 overflow-hidden flex flex-col max-h-[80vh]">
            <DialogHeader className="text-right">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 justify-end mb-2">
                <span className="text-rose-500 font-mono">({selectedError?.count})</span>
                الأشخاص المتأثرون
              </DialogTitle>
              <DialogDescription className="text-right text-slate-500 leading-relaxed font-medium">
                هذه القائمة بأسماء كافة المستخدمين الذين واجهوا الخطأ:
                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 text-sm font-bold text-center">
                  {selectedError?.errorMessage}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex-1 min-h-0">
              <ScrollArea className="h-[450px] w-full pr-4" dir="rtl">
                <UserListContent errorMessage={selectedError?.errorMessage || ""} />
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function UserListContent({ errorMessage }: { errorMessage: string }) {
  const { data: details, isLoading } = useGetErrorDetails(errorMessage);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
        <RefreshCcw className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium">جاري جلب القائمة...</p>
      </div>
    );
  }

  if (!details || details.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">لا يوجد بيانات حالياً</div>
    );
  }

  // Group by user name to avoid duplicates if same user had error multiple times
  const uniqueUsers = Array.from(new Set(details.map(d => d.userFullName || "مستخدم غير معروف")));

  return (
    <div className="space-y-3 pb-4">
      {uniqueUsers.map((userName, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 rounded-full flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 group-hover:text-primary transition-colors">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">{userName}</p>
            <p className="text-[10px] text-slate-400 font-medium">مستخدم نشط في النظام</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorGroupRow({ errorGroup, onClick }: { errorGroup: ErrorSummary, onClick: () => void }) {
  const resolveMutation = useResolveError();

  const handleResolve = (e: React.MouseEvent) => {
    e.stopPropagation();
    resolveMutation.mutate(errorGroup.errorMessage, {
      onSuccess: () => {
        toast.success("تم تحديث الحالة بنجاح: تم الحل");
      },
      onError: () => {
        toast.error("حدث خطأ أثناء محاولة تحديث الحالة");
      }
    });
  };

  return (
    <div className="transition-colors hover:bg-slate-50 bg-white">
      {/* Group Header (Clickable) */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 cursor-pointer gap-4 group"
        onClick={onClick}
      >
        <div className="flex items-start gap-4 overflow-hidden">
          <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${errorGroup.count > 5 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-700 sm:text-lg line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors">
              {errorGroup.errorMessage}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
              <Badge
                variant="outline"
                className={`bg-white hover:bg-rose-50 transition-colors ${errorGroup.count > 5 ? 'border-rose-200 text-rose-600' : 'border-amber-200 text-amber-600'}`}
              >
                تكرر {errorGroup.count} مرة
              </Badge>
              <div className="flex items-center gap-1.5 opacity-80">
                <Clock className="w-3.5 h-3.5" />
                آخر ظهور: {formatDate(errorGroup.lastOccurrence)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ms-auto w-full sm:w-auto mt-2 sm:mt-0 pt-3 border-t sm:border-0 sm:pt-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex-1 sm:flex-initial"
            onClick={handleResolve}
            disabled={resolveMutation.isPending}
          >
            {resolveMutation.isPending ? <RefreshCcw className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-1.5" />}
            تم الحل
          </Button>
        </div>
      </div>
    </div>
  );
}
