import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  GraduationCap,
  User,
  Calendar,
  Filter,
  FileImage,
  ExternalLink,
} from "lucide-react";
import { StudentDetailsModal } from "./StudentDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetGradingResults } from "@/hooks/use-grading";
import { useGetExams } from "@/hooks/use-exams";
import { useGetClasses } from "@/hooks/use-classes";
import { Badge } from "@/components/ui/badge";

export function GradingResultsTable() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(
    undefined
  );
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(
    undefined
  );
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
      setPageNumber(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Reset to first page when filters change
  useEffect(() => {
    setPageNumber(1);
  }, [selectedExamId, selectedClassId, pageSize]);

  const { data: examsData, isLoading: isLoadingExams } = useGetExams();
  const { data: classesData, isLoading: isLoadingClasses } = useGetClasses();

  const { data, isLoading, error } = useGetGradingResults({
    pageNumber,
    pageSize,
    examId: selectedExamId,
    classId: selectedClassId,
    searchValue: debouncedSearch || undefined,
  });

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

  const getGradeBadge = (grade: number, maxGrade?: number) => {
    if (!maxGrade) return <Badge variant="secondary">{grade}</Badge>;
    const percentage = (grade / maxGrade) * 100;

    if (percentage >= 80) {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm px-3 py-1">
          {grade} / {maxGrade} (امتياز)
        </Badge>
      );
    }
    if (percentage >= 65) {
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-sm px-3 py-1">
          {grade} / {maxGrade} (جيد جداً)
        </Badge>
      );
    }
    if (percentage >= 50) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm px-3 py-1">
          {grade} / {maxGrade} (مقبول)
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-sm px-3 py-1">
        {grade} / {maxGrade} (ضعيف)
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>نتائج التصحيح</CardTitle>
        <CardDescription>
          عرض جميع نتائج التصحيح مع إمكانية التصفية والبحث
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-wrap items-end gap-4">
          {/* Exam Filter */}
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label htmlFor="exam-filter" className="text-sm font-semibold flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-primary" />
              تصفية حسب الاختبار
            </Label>
            <Select
              value={selectedExamId || "all"}
              onValueChange={(value) => {
                setSelectedExamId(value === "all" ? undefined : value);
              }}
              disabled={isLoadingExams}
            >
              <SelectTrigger id="exam-filter" className="bg-white border-slate-200">
                <SelectValue placeholder="جميع الاختبارات" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingExams ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    جاري التحميل...
                  </div>
                ) : (
                  <>
                    <SelectItem value="all">جميع الاختبارات</SelectItem>
                    {examsData && examsData.length > 0 ? (
                      examsData.map((exam) => (
                        <SelectItem key={exam.id} value={String(exam.id)}>
                          {exam.title} - {exam.subject}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        لا توجد اختبارات متاحة
                      </div>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Class Filter */}
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label htmlFor="class-filter" className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              تصفية حسب الفصل
            </Label>
            <Select
              value={selectedClassId || "all"}
              onValueChange={(value) => {
                setSelectedClassId(value === "all" ? undefined : value);
              }}
              disabled={isLoadingClasses}
            >
              <SelectTrigger id="class-filter" className="bg-white border-slate-200">
                <SelectValue placeholder="جميع الفصول" />
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
                          {classItem.name}
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

          <div className="flex-1 min-w-[240px] space-y-2">
            <Label htmlFor="search" className="text-sm font-semibold flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-primary" />
              بحث سريع
            </Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="ابحث عن اختبار أو طالب..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pr-10 h-10 border-slate-200 focus:border-primary focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-32" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-destructive">
              حدث خطأ أثناء تحميل النتائج. يرجى المحاولة مرة أخرى.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      اسم الطالب
                    </th>
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      الاختبار
                    </th>
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      المادة
                    </th>
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      الفصل
                    </th>
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      الدرجة
                    </th>
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      تاريخ التصحيح
                    </th>
                    <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.items.map((result) => (
                    <tr
                      key={result.id}
                      className="transition-colors hover:bg-slate-50/50 group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-semibold text-slate-700">
                            {result.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <FileCheck className="h-4 w-4 text-slate-400" />
                          <span>{result.examName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-normal border-slate-200 text-slate-500">
                          {result.examSubject}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <GraduationCap className="h-4 w-4 text-slate-400" />
                          <span>{result.className}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getGradeBadge(result.grade ?? 0, result.maxGrade ?? 100)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(result.gradedAt ?? "")}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {result.questionDetails && (
                            <StudentDetailsModal
                              studentName={result.studentName}
                              details={result.questionDetails}
                              score={result.grade ?? 0}
                              total={result.maxGrade ?? 0}
                            />
                          )}
                          {result.annotatedImageUrl && (
                            <a
                              href={result.annotatedImageUrl?.startsWith('http')
                                ? result.annotatedImageUrl
                                : `${import.meta.env.VITE_AI_SERVER_URL}/${result.annotatedImageUrl.replace(/^\/+/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:border-indigo-300 hover:text-indigo-800 transition-all duration-200 shadow-sm hover:shadow"
                            >
                              <FileImage className="h-3.5 w-3.5" />
                              <span>عرض</span>
                              <ExternalLink className="h-3 w-3 opacity-70" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.items.length === 0 && (
              <div className="py-20 text-center bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-100">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                  <Search className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600">لم يتم العثور على نتائج</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
                  {debouncedSearch || selectedExamId || selectedClassId
                    ? "جرب تغيّر معايير البحث أو التصفية للحصول على نتائج أفضل"
                    : "ابدأ بتصحيح بعض الاختبارات لتظهر لك هنا"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {data && data.items.length > 0 && (
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-6">
                  {data.totalPages > 1 && (
                    <div className="text-sm font-medium text-slate-500">
                      الصفحة <span className="text-primary">{pageNumber}</span> من {data.totalPages}
                      <span className="mx-2 text-slate-300">|</span>
                      الإجمالي: <span className="text-slate-700">{data.totalCount}</span> نتيجة
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="page-size"
                      className="text-xs font-bold text-slate-400 uppercase tracking-tighter"
                    >
                      عرض:
                    </Label>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => setPageSize(Number(value))}
                    >
                      <SelectTrigger
                        id="page-size"
                        className="w-16 h-8 bg-white border-slate-200 text-xs font-bold"
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

                {data.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white border-slate-200 hover:bg-slate-50 h-9"
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={!data.hasPreviousPage || isLoading}
                    >
                      <ChevronRight className="h-4 w-4 ml-2" />
                      السابق
                    </Button>
                    <div className="flex gap-1">
                      {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                        const pNum = i + 1; // Simplistic paged view
                        return (
                          <Button
                            key={i}
                            variant={pageNumber === pNum ? "default" : "ghost"}
                            size="sm"
                            className="w-9 h-9"
                            onClick={() => setPageNumber(pNum)}
                          >
                            {pNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white border-slate-200 hover:bg-slate-50 h-9"
                      onClick={() =>
                        setPageNumber((p) => Math.min(data.totalPages, p + 1))
                      }
                      disabled={!data.hasNextPage || isLoading}
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
  );
}
