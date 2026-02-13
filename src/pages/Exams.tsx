import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Search,
  Trash2,
  Calendar,
  FileText as FileTextIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Info,
  // ---------- Icons for documentation ----------
  FileDown,
  Table,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { useGetExams } from "@/hooks/use-exams";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteExamDialog } from "@/components/exams/DeleteExamDialog";
import { GeneratePapersDialog } from "@/components/exams/GeneratePapersDialog";

// ----- Dialog + Tooltip imports -----
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// ------------------------------------

export default function Exams() {
  const navigate = useNavigate();
  // Dialog State
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  // Table State
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // ---------- State for the info dialog ----------
  const [infoOpen, setInfoOpen] = useState(false);
  // -----------------------------------------------

  const {
    data: exams,
    isLoading: examsLoading,
    error: examsError,
  } = useGetExams();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleDelete = (examId: string) => {
    setDeletingExamId(examId);
  };

  const handleDeleteSuccess = () => {
    setDeletingExamId(null);
  };

  const handleGenerateSuccess = () => {
    // Dialog will close automatically, no need to do anything
  };

  // Filter exams based on search
  const filteredExams =
    exams?.filter(
      (exam) =>
        exam.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        exam.subject.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExams = filteredExams.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الاختبارات</h1>
          <p className="text-muted-foreground mt-2">
            رفع الاختبارات وإنشاء أوراق الطلاب
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Exam Card */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:bg-accent"
            onClick={() => navigate("/exams/new")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>رفع اختبار جديد</CardTitle>
                  <CardDescription>
                    ارفع ورقة الأسئلة PDF واملأ المعلومات المطلوبة
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                رفع اختبار جديد
              </Button>
            </CardContent>
          </Card>

          {/* Generate and Download Papers Card */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:bg-accent"
            onClick={() => setIsGenerateDialogOpen(true)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileTextIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>إنشاء وتحميل أوراق الطلاب</CardTitle>
                  <CardDescription>
                    اختر الاختبار والفصل لإنشاء وتحميل أوراق الطلاب
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="h-4 w-4 ml-2" />
                إنشاء وتحميل أوراق PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الاختبارات</CardTitle>
            <CardDescription>
              عرض وإدارة جميع الاختبارات المسجلة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن اختبار بالاسم أو المادة..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Exams Table */}
            {examsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-12 w-24" />
                  </div>
                ))}
              </div>
            ) : examsError ? (
              <div className="py-12 text-center">
                <p className="text-sm text-destructive">
                  حدث خطأ أثناء تحميل الاختبارات. يرجى المحاولة مرة أخرى.
                </p>
              </div>
            ) : (
              <>
                {filteredExams.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {searchValue
                        ? "لا توجد نتائج للبحث"
                        : "لا توجد اختبارات مسجلة"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                              اسم الاختبار
                            </th>
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                              المادة
                            </th>
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                              عدد الصفحات
                            </th>
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                              تاريخ الإنشاء
                            </th>
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                              الإجراءات
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedExams.map((exam) => (
                            <tr
                              key={exam.id}
                              className="border-b transition-colors hover:bg-accent/50"
                            >
                              <td className="p-4">
                                <div className="font-medium">{exam.title}</div>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {exam.subject}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                                  {exam.numberOfPages} صفحة
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(exam.createdAt)}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDelete(String(exam.id))
                                    }
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="text-sm text-muted-foreground">
                          الصفحة {currentPage} من {totalPages} (
                          {filteredExams.length} اختبار)
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1 || examsLoading}
                          >
                            <ChevronRight className="h-4 w-4 ml-2" />
                            السابق
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={
                              currentPage === totalPages || examsLoading
                            }
                          >
                            التالي
                            <ChevronLeft className="h-4 w-4 mr-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <GeneratePapersDialog
          open={isGenerateDialogOpen}
          onOpenChange={setIsGenerateDialogOpen}
          onSuccess={handleGenerateSuccess}
        />

        {deletingExamId && (
          <DeleteExamDialog
            open={!!deletingExamId}
            onOpenChange={(open) => !open && setDeletingExamId(null)}
            examId={deletingExamId}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </div>

      {/* ---------- FLOATING INFO BUTTON – دليل استخدام صفحة الاختبارات ---------- */}
      <TooltipProvider>
        <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="fixed bottom-6 left-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  aria-label="دليل استخدام صفحة الاختبارات"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-sm">
              <p>دليل استخدام صفحة الاختبارات</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent
            className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
            dir="rtl"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                كيفية التعامل مع صفحة الاختبارات
              </DialogTitle>
              <DialogDescription className="text-base">
                دليل سريع لاستخدام صفحة إدارة الاختبارات
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <p className="text-muted-foreground leading-relaxed">
                <strong>صفحة الاختبارات</strong> تتيح لك إدارة جميع الاختبارات في النظام،
                ورفع اختبارات جديدة، وإنشاء أوراق الطلاب، والبحث والفلترة.
              </p>

              <div className="space-y-4">
                {/* رفع اختبار جديد */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">رفع اختبار جديد</h4>
                    <p className="text-sm text-muted-foreground">
                      انقر على بطاقة <strong>“رفع اختبار جديد”</strong> أو الزر الموجود فيها.
                      ستنتقل إلى صفحة رفع الملفات حيث يمكنك اختيار ملف PDF وتحديد موقع الباركود.
                    </p>
                  </div>
                </div>

                {/* إنشاء أوراق الطلاب */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <FileDown className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">إنشاء أوراق الطلاب</h4>
                    <p className="text-sm text-muted-foreground">
                      استخدم بطاقة <strong>“إنشاء وتحميل أوراق الطلاب”</strong> لاختيار اختبار وفصل
                      وتحميل ملف ZIP يحتوي على أوراق PDF جاهزة للطباعة لكل طالب.
                    </p>
                  </div>
                </div>

                {/* البحث في القائمة */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">البحث والفلترة</h4>
                    <p className="text-sm text-muted-foreground">
                      اكتب اسم الاختبار أو المادة في مربع البحث لتصفية القائمة.
                      النتائج تتغير أثناء الكتابة.
                    </p>
                  </div>
                </div>

                {/* عرض الجدول */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <Table className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">عرض الاختبارات</h4>
                    <p className="text-sm text-muted-foreground">
                      يعرض الجدول جميع الاختبارات مع تفاصيل: الاسم، المادة، عدد الصفحات،
                      تاريخ الإنشاء، وإجراء الحذف.
                    </p>
                  </div>
                </div>

                {/* حذف اختبار */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <Trash className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">حذف اختبار</h4>
                    <p className="text-sm text-muted-foreground">
                      انقر على أيقونة <strong>سلة المهملات</strong> بجانب الاختبار لحذفه.
                      سيطلب منك تأكيد الحذف.
                    </p>
                  </div>
                </div>

                {/* ترقيم الصفحات */}
                {totalPages > 1 && (
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                      <ChevronLeft className="h-6 w-6 text-primary" />
                      <ChevronRight className="h-6 w-6 text-primary -mr-2" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">ترقيم الصفحات</h4>
                      <p className="text-sm text-muted-foreground">
                        استخدم أزرار <strong>السابق</strong> و<strong>التالي</strong> للتنقل بين الصفحات.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground border-t pt-4 mt-2">
                ملاحظة: عند حذف اختبار، لا يمكن التراجع عن هذه العملية.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInfoOpen(false)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
      {/* ------------------------------------------------------------------ */}
    </MainLayout>
  );
}