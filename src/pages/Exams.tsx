import { useState, useEffect } from "react";
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
import { UploadExamDialog } from "@/components/exams/UploadExamDialog";
import { GeneratePapersDialog } from "@/components/exams/GeneratePapersDialog";
import { DownloadExamPapersDialog } from "@/components/exams/DownloadExamPapersDialog";

export default function Exams() {
  // Dialog State
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  // Table State
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  const handleUploadSuccess = () => {
    // Dialog will close automatically, no need to do anything
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
          <h1 className="text-3xl font-bold text-foreground">الامتحانات</h1>
          <p className="text-muted-foreground mt-2">
            رفع الامتحانات وإنشاء أوراق الطلاب
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload Exam Card */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>رفع امتحان جديد</CardTitle>
                  <CardDescription>
                    ارفع ورقة الأسئلة PDF واملأ المعلومات المطلوبة
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                رفع امتحان جديد
              </Button>
            </CardContent>
          </Card>

          {/* Generate Papers Card */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
            onClick={() => setIsGenerateDialogOpen(true)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileTextIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>إنشاء أوراق الطلاب</CardTitle>
                  <CardDescription>
                    اختر الامتحان والفصل لإنشاء أوراق الطلاب
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                إنشاء أوراق PDF
              </Button>
            </CardContent>
          </Card>

          {/* Download Exam Papers Card */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
            onClick={() => setIsDownloadDialogOpen(true)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>تحميل أوراق الامتحان</CardTitle>
                  <CardDescription>
                    اختر الامتحان لتحميل جميع أوراق الطلاب
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 ml-2" />
                تحميل أوراق PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الامتحانات</CardTitle>
            <CardDescription>
              عرض وإدارة جميع الامتحانات المسجلة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن امتحان بالاسم أو المادة..."
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
                  حدث خطأ أثناء تحميل الامتحانات. يرجى المحاولة مرة أخرى.
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
                        : "لا توجد امتحانات مسجلة"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                              اسم الامتحان
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
                          {filteredExams.length} امتحان)
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
        <UploadExamDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onSuccess={handleUploadSuccess}
        />

        <GeneratePapersDialog
          open={isGenerateDialogOpen}
          onOpenChange={setIsGenerateDialogOpen}
          onSuccess={handleGenerateSuccess}
        />

        <DownloadExamPapersDialog
          open={isDownloadDialogOpen}
          onOpenChange={setIsDownloadDialogOpen}
          onSuccess={() => {}}
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
    </MainLayout>
  );
}
