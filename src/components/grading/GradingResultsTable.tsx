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
  Loader2,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
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
import { useAuth } from "@/hooks/use-auth";
import { adminApi, type UserDto } from "@/lib/adminApi";
import { ManualGradingModal } from "./ManualGradingModal";
import { useQueryClient } from "@tanstack/react-query";
import type { GradingDetail } from "@/types/grading";

export function GradingResultsTable() {
  const queryClient = useQueryClient();
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
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(undefined);
  const [teachers, setTeachers] = useState<UserDto[]>([]);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | "papers-pdf" | null>(null);
  const [onlyAnonymous, setOnlyAnonymous] = useState(false);
  const [reviewingPaper, setReviewingPaper] = useState<{
    id: string | number;
    studentId: string | number;
    studentName: string;
    details: GradingDetail[];
    annotatedImageUrl?: string;
    classId?: string | number;
  } | null>(null);

  const { data: user } = useAuth();
  const isAdmin = user?.roles?.some(role => role.toLowerCase() === "admin");

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
  }, [selectedExamId, selectedClassId, selectedTeacherId, pageSize, onlyAnonymous]);

  // Fetch teachers if admin
  useEffect(() => {
    if (isAdmin) {
      adminApi.getUsers().then(setTeachers).catch(console.error);
    }
  }, [isAdmin]);

  const { data: examsData, isLoading: isLoadingExams } = useGetExams();
  const { data: classesData, isLoading: isLoadingClasses } = useGetClasses();

  const { data, isLoading, error } = useGetGradingResults({
    pageNumber,
    pageSize,
    examId: selectedExamId,
    classId: selectedClassId,
    searchValue: debouncedSearch || undefined,
    teacherId: selectedTeacherId,
    onlyAnonymous,
  });

  const handleExport = async (format: "excel" | "pdf" | "papers-pdf") => {
    if (!selectedExamId) {
      toast.error("يرجى اختيار اختبار أولاً للتصدير");
      return;
    }

    setIsExporting(format);
    try {
      let endpoint = "";
      if (format === "excel") endpoint = "report-exam-results-excel";
      else if (format === "pdf") endpoint = "report-exam-results-pdf";
      else if (format === "papers-pdf") endpoint = "export-corrected-papers-pdf";

      let urlSearchParams = `examId=${selectedExamId}`;
      if (selectedTeacherId) urlSearchParams += `&teacherId=${selectedTeacherId}`;
      if (selectedClassId) urlSearchParams += `&classId=${selectedClassId}`;

      const response = await api.get(`/api/Reports/${endpoint}?${urlSearchParams}`, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"] || response.headers["Content-Disposition"];

      // Default filename fallback using exam title if possible
      const selectedExam = examsData?.find(e => String(e.id) === selectedExamId);
      const cleanTitle = selectedExam?.title?.replace(/[\\/:*?"<>|]/g, "_") || "درجات_الاختبار";
      let filename = format === "excel" ? `${cleanTitle}.xlsx` : format === "papers-pdf" ? `${cleanTitle}_أوراق_الطلاب.pdf` : `${cleanTitle}.pdf`;

      if (contentDisposition) {
        // Prioritize filename* (UTF-8)
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          filename = decodeURIComponent(filenameStarMatch[1]);
        } else {
          // Fallback to standard filename
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ""));
          }
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("تم تصدير الدرجات بنجاح");
    } catch (error: any) {
      console.error("Export failed", error);
      toast.error("فشل تصدير الدرجات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsExporting(null);
    }
  };

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

  const formatArabicNumber = (num: number): string => {
    const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return num
      .toString()
      .split("")
      .map((digit) => arabicNumbers[parseInt(digit)])
      .join("");
  };

  const getGradeBadge = (grade: number, maxGrade?: number) => {
    if (!maxGrade) return <Badge variant="secondary" className="whitespace-nowrap px-2 py-0.5 text-[10px] sm:text-xs font-mono">{grade}</Badge>;
    const percentage = (grade / maxGrade) * 100;

    if (percentage >= 80) {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm px-2 sm:px-3 py-0.5 sm:py-1 whitespace-nowrap text-[10px] sm:text-xs flex items-center justify-center min-w-max">
          <span className="font-mono" dir="ltr">{grade}/{maxGrade}</span> <span className="hidden sm:inline sm:mr-1">(امتياز)</span>
        </Badge>
      );
    }
    if (percentage >= 65) {
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-sm px-2 sm:px-3 py-0.5 sm:py-1 whitespace-nowrap text-[10px] sm:text-xs flex items-center justify-center min-w-max">
          <span className="font-mono" dir="ltr">{grade}/{maxGrade}</span> <span className="hidden sm:inline sm:mr-1">(جيد جداً)</span>
        </Badge>
      );
    }
    if (percentage >= 50) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm px-2 sm:px-3 py-0.5 sm:py-1 whitespace-nowrap text-[10px] sm:text-xs flex items-center justify-center min-w-max">
          <span className="font-mono" dir="ltr">{grade}/{maxGrade}</span> <span className="hidden sm:inline sm:mr-1">(مقبول)</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-sm px-2 sm:px-3 py-0.5 sm:py-1 whitespace-nowrap text-[10px] sm:text-xs flex items-center justify-center min-w-max">
        <span className="font-mono" dir="ltr">{grade}/{maxGrade}</span> <span className="hidden sm:inline sm:mr-1">(ضعيف)</span>
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
      <CardContent className="space-y-6">
        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-200">
          <Button
            variant={!onlyAnonymous ? "default" : "ghost"}
            size="sm"
            onClick={() => setOnlyAnonymous(false)}
            className={`rounded-xl h-9 px-4 font-bold transition-all ${!onlyAnonymous ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"}`}
          >
            <Users className="w-4 h-4 ml-2" />
            كل الطلاب
          </Button>
          <Button
            variant={onlyAnonymous ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setOnlyAnonymous(true);
              setSelectedClassId(undefined); // Reset class filter as anonymous papers don't have one
              setSelectedTeacherId(undefined);
              setSearchValue("");
            }}
            className={`rounded-xl h-9 px-4 font-bold transition-all ${onlyAnonymous ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600" : "text-slate-500 hover:text-rose-600 hover:bg-rose-50/50"}`}
          >
            <AlertCircle className="w-4 h-4 ml-2" />
            طلاب غير معروفين
            {data?.anonymousCount !== undefined && data.anonymousCount > 0 && (
              <Badge className="mr-2 bg-rose-100 text-rose-600 border-0 text-[10px] h-4.5 px-1.5 animate-pulse">
                {data.anonymousCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-muted/50 p-4 rounded-2xl border flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-row items-stretch lg:items-end gap-4">
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
                className="pr-10 h-10 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Teacher Filter (Admin Only) */}
          {isAdmin && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="teacher-filter" className="text-sm font-semibold flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" />
                تصفية حسب المعلم
              </Label>
              <Select
                value={selectedTeacherId || "all"}
                onValueChange={(value) => {
                  setSelectedTeacherId(value === "all" ? undefined : value);
                }}
              >
                <SelectTrigger id="teacher-filter" className="bg-white border-slate-200">
                  <SelectValue placeholder="جميع المعلمين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعلمين</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto md:col-span-2 lg:col-span-1">
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all font-bold flex-1 sm:flex-none"
              onClick={() => handleExport("papers-pdf")}
              disabled={!!isExporting}
            >
              {isExporting === "papers-pdf" ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <FileImage className="w-4 h-4 ml-2" />
              )}
              <span className="whitespace-nowrap">صور الأوراق</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-bold flex-1 sm:flex-none"
              onClick={() => handleExport("excel")}
              disabled={!!isExporting}
            >
              {isExporting === "excel" ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 ml-2" />
              )}
              <span className="whitespace-nowrap">Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all font-bold flex-1 sm:flex-none"
              onClick={() => handleExport("pdf")}
              disabled={!!isExporting}
            >
              {isExporting === "pdf" ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 ml-2" />
              )}
              <span className="whitespace-nowrap">PDF</span>
            </Button>
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
            <p className="text-sm text-destructive font-medium">
              حدث خطأ أثناء تحميل النتائج. يرجى المحاولة مرة أخرى.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/80 border-b">
                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10 sm:w-14">
                      #
                    </th>
                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      اسم الطالب
                    </th>
                    {isAdmin && (
                      <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                        المعلم
                      </th>
                    )}
                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      الاختبار
                    </th>
                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      المادة
                    </th>
                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                      الفصل
                    </th>
                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                      الدرجة
                    </th>
                    <th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden xl:table-cell">
                      تاريخ التصحيح
                    </th>
                    <th className="text-center p-2 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider w-20 sm:w-32">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.items.map((result, index) => (
                    <tr
                      key={result.id}
                      className="transition-colors hover:bg-muted/50 group"
                    >
                      <td className="p-3 sm:p-4 text-[10px] sm:text-xs text-slate-500 font-bold">
                        {formatArabicNumber((pageNumber - 1) * pageSize + index + 1)}
                      </td>
                      <td className="p-2 sm:p-4 max-w-[120px] sm:max-w-none">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="hidden sm:flex w-8 h-8 rounded-full bg-primary/10 items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className={`font-semibold text-[11px] sm:text-sm truncate ${(!result.studentId || result.studentId === "0" || result.studentId === 0) ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100" : ""}`}>
                            {(!result.studentId || result.studentId === "0" || result.studentId === 0 || result.studentName?.includes("طالب مجهول"))
                              ? `طالب مجهول ${formatArabicNumber((pageNumber - 1) * pageSize + index + 1)}`
                              : result.studentName || "غير معروف"}
                          </span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="p-2 sm:p-4 hidden sm:table-cell">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span className="text-sm">{result.teacherName || "غير معروف"}</span>
                          </div>
                        </td>
                      )}
                      <td className="p-2 sm:p-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileCheck className="h-4 w-4" />
                          <span className="truncate max-w-[150px]">{result.examName || "غير معروف"}</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 hidden md:table-cell">
                        <Badge variant="outline" className="font-normal border-border text-muted-foreground">
                          {result.examSubject}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          <span>{result.className}</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getGradeBadge(result.grade ?? 0, result.maxGrade ?? 100)}
                          {result.questionDetails?.some(d => !d.pred || d.pred.trim() === "" || d.pred === "None") && (
                            <Badge variant="outline" className="w-fit text-[9px] sm:text-[10px] px-1.5 py-0 sm:py-0.5 items-center gap-1 bg-amber-50 text-amber-600 border-amber-200 animate-pulse whitespace-nowrap">
                              <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">بحاجة لمراجعة </span>(متروك)
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 hidden xl:table-cell">
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400">
                          <Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                          <span>{formatDate(result.gradedAt ?? "")}</span>
                        </div>
                      </td>
                      <td className="p-1.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-1.5 sm:gap-2 transition-opacity w-full">
                          {result.questionDetails && (
                            <StudentDetailsModal
                              studentName={result.studentName}
                              details={result.questionDetails}
                              score={result.grade ?? 0}
                              total={result.maxGrade ?? 0}
                            />
                          )}
                          {result.questionDetails && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-8 sm:w-auto sm:h-8 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 px-0 sm:px-3 text-[10px] sm:text-sm font-bold flex items-center justify-center shrink-0"
                              onClick={() => setReviewingPaper({
                                id: result.id,
                                studentId: result.studentId || 0,
                                studentName: result.studentName,
                                details: result.questionDetails || [],
                                annotatedImageUrl: result.annotatedImageUrl,
                                classId: result.classId
                              })}
                            >
                              <AlertCircle className="w-3 w-3 sm:h-3.5 sm:h-3.5 sm:ml-1.5" />
                              <span className="hidden sm:inline">مراجعة وتعديل</span>
                            </Button>
                          )}
                          {result.annotatedImageUrl && (
                            <a
                              href={(() => {
                                const annotatedImageUrl = result.annotatedImageUrl;
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
                              className="inline-flex items-center justify-center h-6 w-8 sm:w-auto sm:h-8 gap-1 sm:gap-1.5 px-0 sm:px-3 text-[10px] sm:text-xs font-semibold rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow shrink-0"
                            >
                              <FileImage className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="hidden sm:inline">عرض</span>
                              <ExternalLink className="hidden sm:block h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-70" />
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
              <div className="py-12 sm:py-20 text-center bg-muted/30 rounded-2xl border-2 border-dashed border-muted mx-2">
                <div className="bg-white w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                  <Search className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-600 px-4">لم يتم العثور على نتائج</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-[200px] sm:max-w-xs mx-auto px-4">
                  {debouncedSearch || selectedExamId || selectedClassId
                    ? "جرب تغيّر معايير البحث أو التصفية للحصول على نتائج أفضل"
                    : "ابدأ بتصحيح بعض الاختبارات لتظهر لك هنا"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {data && data.items.length > 0 && (
              <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-2xl border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {data.totalPages > 1 && (
                    <div className="text-[11px] sm:text-sm font-medium text-muted-foreground bg-white/50 px-3 py-1.5 rounded-lg border border-slate-100 sm:bg-transparent sm:p-0 sm:border-0 uppercase tracking-tighter">
                      الصفحة <span className="text-primary font-bold">{pageNumber}</span> من {data.totalPages}
                      <span className="mx-2 text-slate-300 hidden sm:inline">|</span>
                      <span className="sm:hidden block mt-1 text-[10px] text-slate-400">الإجمالي: {data.totalCount} نتيجة</span>
                      <span className="hidden sm:inline">الإجمالي: <span className="text-foreground font-bold">{data.totalCount}</span> نتيجة</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="page-size"
                      className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap"
                    >
                      عرض:
                    </Label>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => setPageSize(Number(value))}
                    >
                      <SelectTrigger
                        id="page-size"
                        className="w-14 sm:w-16 h-8 bg-background border-border text-[11px] sm:text-xs font-bold"
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
                      className="h-9 text-xs sm:text-sm font-bold"
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={!data.hasPreviousPage || isLoading}
                    >
                      <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
                      السابق
                    </Button>
                    <div className="flex flex-wrap justify-center gap-1">
                      {[...Array(data.totalPages)].map((_, i) => {
                        const pNum = i + 1;
                        // لإصلاح الديزاين ع الموبايل: نظهر فقط الصفحة الحالية وجيرانها أو أول صفحتين
                        const isVisible =
                          data.totalPages <= 3 ||
                          pNum === pageNumber ||
                          pNum === pageNumber - 1 ||
                          pNum === pageNumber + 1 ||
                          (pageNumber === 1 && pNum <= 2) ||
                          (pageNumber === data.totalPages && pNum >= data.totalPages - 2);

                        if (!isVisible) return null;

                        return (
                          <Button
                            key={i}
                            variant={pageNumber === pNum ? "default" : "ghost"}
                            size="sm"
                            className="w-8 h-8 sm:w-9 sm:h-9 text-[11px] sm:text-sm font-bold"
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
                      className="h-9 text-xs sm:text-sm font-bold"
                      onClick={() =>
                        setPageNumber((p) => Math.min(data.totalPages, p + 1))
                      }
                      disabled={!data.hasNextPage || isLoading}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      {reviewingPaper && (
        <ManualGradingModal
          isOpen={!!reviewingPaper}
          onClose={() => setReviewingPaper(null)}
          paperId={reviewingPaper.id}
          studentId={reviewingPaper.studentId}
          studentName={reviewingPaper.studentName}
          details={reviewingPaper.details}
          annotatedImageUrl={reviewingPaper.annotatedImageUrl}
          classId={reviewingPaper.classId}
          onSuccess={() => {
            setReviewingPaper(null);
            // Re-fetch data to sync all views (table and details modal)
            queryClient.invalidateQueries({ queryKey: ["grading-results"] });
            toast.success("تم تحديث البيانات في الجدول بنجاح");
          }}
        />
      )}
    </Card >
  );
}
