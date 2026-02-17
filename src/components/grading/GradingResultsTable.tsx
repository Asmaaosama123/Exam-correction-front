import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  GraduationCap,
  User,
  Calendar,
} from "lucide-react";
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

  const getGradeColor = (
    grade: number,
    maxGrade?: number
  ): "default" | "secondary" | "destructive" => {
    if (!maxGrade) return "default";
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
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
        <div className="grid gap-4 md:grid-cols-3">
          {/* Exam Filter */}
          <div className="space-y-2">
            <Label htmlFor="exam-filter">تصفية حسب الاختبار</Label>
            <Select
              value={selectedExamId || "all"}
              onValueChange={(value) => {
                setSelectedExamId(value === "all" ? undefined : value);
              }}
              disabled={isLoadingExams}
            >
              <SelectTrigger id="exam-filter">
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
          <div className="space-y-2">
            <Label htmlFor="class-filter">تصفية حسب الفصل</Label>
            <Select
              value={selectedClassId || "all"}
              onValueChange={(value) => {
                setSelectedClassId(value === "all" ? undefined : value);
              }}
              disabled={isLoadingClasses}
            >
              <SelectTrigger id="class-filter">
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

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">بحث</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="ابحث عن اختبار أو طالب..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pr-10"
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      اسم الطالب
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      الاختبار
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      المادة
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      الفصل
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      الدرجة
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      تاريخ التصحيح
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b transition-colors hover:bg-accent/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {result.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <span>{result.examName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {result.examSubject}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span>{result.className}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={getGradeColor(result.grade ?? 0, result.maxGrade ?? 100)} className="text-sm font-semibold"
                        >
                          {result.grade}
                          {result.maxGrade ? ` / ${result.maxGrade}` : ""}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(result.gradedAt ?? "")}</span>                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.items.length === 0 && (
              <div className="py-12 text-center">
                <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {debouncedSearch || selectedExamId || selectedClassId
                    ? "لم يتم العثور على نتائج بهذه المعايير"
                    : "لا توجد نتائج تصحيح متاحة"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {data && data.items.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {data.totalPages > 1 && (
                    <div className="text-sm text-muted-foreground">
                      الصفحة {pageNumber} من {data.totalPages} (إجمالي:{" "}
                      {data.totalCount} نتيجة)
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
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {data.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={!data.hasPreviousPage || isLoading}
                    >
                      <ChevronRight className="h-4 w-4 ml-2" />
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
