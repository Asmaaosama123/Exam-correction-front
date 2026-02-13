import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Upload,
  ChevronLeft,
  ChevronRight,
  Download,
  CreditCard,
  Calendar,
  Info,
  Filter,
  FileUp,
  FileDown,
  UserPlus,
  UserPen,
  UserX,
  List,
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
import { useGetStudents, useDeleteStudent } from "@/hooks/use-students";
import { useGetClasses } from "@/hooks/use-classes";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import { DeleteStudentDialog } from "@/components/students/DeleteStudentDialog";
import { ImportStudentsDialog } from "@/components/students/ImportStudentsDialog";
import { ExportStudentsDialog } from "@/components/students/ExportStudentsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Dialog + Tooltip imports
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

export default function Students() {
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(
    undefined
  );
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<{
    id: string;
    classId?: string;
  } | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
      setPageNumber(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setPageNumber(1);
  }, [pageSize]);

  const { data: classesData, isLoading: isLoadingClasses } = useGetClasses();
  const { data, isLoading, error } = useGetStudents({
    classId: selectedClassId,
    pageNumber,
    pageSize,
    SearchValue: debouncedSearch || undefined,
  });
  const deleteMutation = useDeleteStudent();

  const handleEdit = (studentId: string) => setEditingStudent(studentId);
  const handleDelete = (studentId: string, className?: string) => {
    let classIdForDelete = selectedClassId;
    if (!classIdForDelete && className && classesData) {
      const foundClass = classesData.find((c) => c.name === className);
      if (foundClass) classIdForDelete = foundClass.id;
    }
    setDeletingStudent({ id: studentId, classId: classIdForDelete });
  };
  const handleAddSuccess = () => setIsAddDialogOpen(false);
  const handleEditSuccess = () => setEditingStudent(null);
  const handleDeleteSuccess = () => setDeletingStudent(null);

  const totalStudents = data?.items.length || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الطلاب</h1>
            <p className="text-muted-foreground mt-2">
              إدارة بيانات الطلاب المسجلين في النظام
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="h-4 w-4 ml-2" />
              تصدير الطلاب
            </Button>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="h-4 w-4 ml-2" />
              استيراد من Excel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة طالب جديد
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي الطلاب
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    طالب في هذه الصفحة
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي الصفحات
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalPages}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    صفحة متاحة
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                الصفحة الحالية
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{pageNumber}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    من {totalPages}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الطلاب</CardTitle>
            <CardDescription>عرض وإدارة جميع الطلاب المسجلين</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Class Selector and Search Bar */}
            <div className="mb-6 space-y-4">
              {/* Class Selector */}
              <div className="space-y-2">
                <Label htmlFor="class-select">اختر الفصل</Label>
                <Select
                  value={selectedClassId || "all"}
                  onValueChange={(value) => {
                    setSelectedClassId(value === "all" ? undefined : value);
                    setPageNumber(1);
                  }}
                  disabled={isLoadingClasses}
                >
                  <SelectTrigger id="class-select" className="w-full sm:w-[300px]">
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingClasses ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        جاري التحميل...
                      </div>
                    ) : (
                      <>
                        <SelectItem value="all">جميع الفصول</SelectItem>
                        {classesData && classesData.length > 0 ? (
                          classesData.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name} ({classItem.numberOfStudents} طالب)
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">
                            لا توجد فصول متاحة
                          </div>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن طالب بالاسم أو الرقم الوطني أو البريد الإلكتروني أو رقم الهاتف..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Students Table */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 w-24" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-destructive">
                  حدث خطأ أثناء تحميل الطلاب. يرجى المحاولة مرة أخرى.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          الاسم
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          الرقم الوطني
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          البريد الإلكتروني
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          رقم الهاتف
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          الصف
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          الحالة
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          تاريخ الإضافة
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.items.map((student) => {
                        const formattedDate = student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString(
                              "ar-SA",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "-";

                        return (
                          <tr
                            key={student.id}
                            className="border-b transition-colors hover:bg-accent/50"
                          >
                            <td className="p-4">
                              <div className="font-medium">{student.fullName}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2 text-sm">
                                <CreditCard className="h-3 w-3 text-muted-foreground" />
                                {student.nationalId || "لا يوجد"}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {student.email || "لا يوجد"}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {student.mobileNumber || "لا يوجد"}
                              </div>
                            </td>
                            <td className="p-4 text-sm">{student.className || "-"}</td>
                            <td className="p-4">
                              {student.isDisabled ? (
                                <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                                  معطل
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
                                  نشط
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formattedDate}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(student.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDelete(student.id, student.className)
                                  }
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {data?.items.length === 0 && (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {debouncedSearch
                        ? "لم يتم العثور على طلاب بهذا البحث"
                        : "لا يوجد طلاب مسجلين"}
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {data && data.items.length > 0 && (
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {totalPages > 1 && (
                        <div className="text-sm text-muted-foreground">
                          الصفحة {pageNumber} من {totalPages}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="page-size"
                          className="text-sm text-muted-foreground"
                        >
                          عدد العناصر:
                        </Label>
                        <Select
                          value={String(pageSize)}
                          onValueChange={(value) => setPageSize(Number(value))}
                        >
                          <SelectTrigger
                            id="page-size"
                            className="w-20 h-8"
                            disabled={isLoading}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                          disabled={!data?.hasPreviouspage || isLoading}
                        >
                          <ChevronRight className="h-4 w-4 ml-2" />
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                          disabled={!data?.hasNextPage || isLoading}
                        >
                          التالي
                          <ChevronLeft className="h-4 w-4 mr-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------- FLOATING INFO BUTTON – perfect match with screenshot ---------- */}
      <TooltipProvider>
        <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="fixed bottom-6 left-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  aria-label="دليل استخدام صفحة الطلاب"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-sm">
              <p>دليل استخدام صفحة الطلاب</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent
            className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
            dir="rtl"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                كيفية التعامل مع صفحة الطلاب
              </DialogTitle>
              <DialogDescription className="text-base">
                دليل سريع لاستخدام صفحة إدارة الطلاب
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <p className="text-muted-foreground leading-relaxed">
                <strong>صفحة الطلاب</strong> تتيح لك إدارة جميع الطلاب المسجلين في النظام،
                مع إمكانية البحث والفلترة حسب الفصل، وإضافة الطلاب بشكل فردي أو عبر استيراد
                من Excel، وتصدير البيانات، بالإضافة إلى تعديل وحذف الطلاب.
              </p>

              <div className="space-y-4">
                {/* كل عنصر بشكله الجميل – icons inside card-like containers */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <Filter className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">تصفية حسب الفصل</h4>
                    <p className="text-sm text-muted-foreground">
                      اختر فصلاً من القائمة المنسدلة لعرض الطلاب المنتمين إليه فقط،
                      أو اختر <strong>“جميع الفصول”</strong> لعرض الكل.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">البحث</h4>
                    <p className="text-sm text-muted-foreground">
                      ابحث عن طالب باستخدام الاسم، الرقم الوطني، البريد الإلكتروني أو رقم الهاتف.
                      النتائج تتغير أثناء الكتابة.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">إضافة طالب جديد</h4>
                    <p className="text-sm text-muted-foreground">
                      انقر على زر <strong>“إضافة طالب جديد”</strong> لإدخال بيانات طالب فردي.
                      يجب اختيار الفصل الذي سينتمي إليه الطالب.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <FileUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">استيراد من Excel</h4>
                    <p className="text-sm text-muted-foreground">
                      استخدم زر <strong>“استيراد من Excel”</strong> لرفع ملف CSV أو XLSX
                      وإضافة عدد كبير من الطلاب دفعة واحدة. يجب تحديد الفصل قبل الاستيراد.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <FileDown className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">تصدير الطلاب</h4>
                    <p className="text-sm text-muted-foreground">
                      يمكنك تصدير قائمة الطلاب إلى ملف Excel أو PDF عبر زر{" "}
                      <strong>“تصدير الطلاب”</strong>. اختر الفصول التي تريدها أو جميع الفصول.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <UserPen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">تعديل أو حذف</h4>
                    <p className="text-sm text-muted-foreground">
                      بجانب كل طالب أيقونتي <strong>تعديل</strong> (قلم) و<strong>حذف</strong> (سلة).
                      يمكنك تحديث بياناته أو حذفه نهائياً مع التأكيد.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <UserX className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">تعطيل / تفعيل</h4>
                    <p className="text-sm text-muted-foreground">
                      في شاشة التعديل يمكنك <strong>تعطيل</strong> الطالب بدلاً من حذفه،
                      وسيظهر في الجدول بحالة “معطل”.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                    <List className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">ترقيم الصفحات</h4>
                    <p className="text-sm text-muted-foreground">
                      يمكنك تغيير عدد الطلاب المعروضين في الصفحة (5، 10، 20، 50)
                      والتنقل بين الصفحات باستخدام أزرار <strong>السابق</strong> و<strong>التالي</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground border-t pt-4 mt-2">
                ملاحظة: عند حذف طالب، لا يمكن التراجع عن هذه العملية.
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

      {/* Dialogs */}
      <StudentFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        defaultClassId={selectedClassId}
        onSuccess={handleAddSuccess}
      />

      {editingStudent && (
        <StudentFormDialog
          open={!!editingStudent}
          onOpenChange={(open) => !open && setEditingStudent(null)}
          defaultClassId={selectedClassId}
          studentId={editingStudent}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingStudent && (
        <DeleteStudentDialog
          open={!!deletingStudent}
          onOpenChange={(open) => !open && setDeletingStudent(null)}
          studentId={deletingStudent.id}
          classId={deletingStudent.classId}
          studentData={data?.items.find((s) => s.id === deletingStudent.id)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <ImportStudentsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />

      <ExportStudentsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </MainLayout>
  );
}