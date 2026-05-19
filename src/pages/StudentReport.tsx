import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    TrendingUp,
    Award,
    Calendar,
    ArrowLeft,
    Loader2,
    AlertCircle,
    FileText as FileDownloader,
    Download,
    LineChart as ChartIcon,
    BarChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { HelpFab } from "@/components/ui/help-fab";
import { MainLayout } from "@/components/layout/MainLayout";
import { useGetStudents } from "@/hooks/use-students";
import {
    useGetStudentProgress,
    useGetStudentsProgressSummary
} from "@/hooks/use-analysis";
import { useGetClasses } from "@/hooks/use-classes";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    LineController,
    BarController,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { cn, formatArabicDate, formatArabicDateOnly } from "@/lib/utils";
import { examsApi } from "@/lib/exams-api";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import "./StudentReport.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    LineController,
    BarController,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function StudentReport() {
    const navigate = useNavigate();
    const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const reportScope = selectedStudentId !== "all" ? "student" : (selectedClassId !== "all" ? "class" : "all");
    const [isDownloading, setIsDownloading] = useState(false);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // Fetch all students sorted alphabetically
    const { data: studentsData, isLoading: studentsLoading } = useGetStudents({
        pageNumber: 1,
        pageSize: 1000,
        classId: selectedClassId === "all" ? undefined : selectedClassId
    });

    // Fetch all global classes
    const { data: globalClasses, isLoading: classesLoading } = useGetClasses();

    // Fetch selected student progress
    const { data: rawProgress, isLoading: progressLoading, error: progressError } = useGetStudentProgress(
        selectedStudentId === "all" ? null : selectedStudentId
    );

    const progress = React.useMemo(() => {
        if (!rawProgress) return null;
        return {
            ...rawProgress,
            examSummaries: rawProgress.examSummaries?.filter((e: any) => e.totalScore > 0) || []
        };
    }, [rawProgress]);

    
    // Fetch students progress summary for "Class" or "All" scopes
    const { data: summaryData, isLoading: summaryLoading } = useGetStudentsProgressSummary(
        reportScope !== "student" ? (selectedClassId === "all" ? undefined : parseInt(selectedClassId)) : undefined
    );

    // Use global classes for the dropdown
    const classes = React.useMemo(() => {
        if (!globalClasses) return [];
        return globalClasses.map((cls: any) => ({ id: cls.id, name: cls.name }));
    }, [globalClasses]);

    // Filter students based on selected class
    const filteredStudents = React.useMemo(() => {
        return studentsData?.items || [];
    }, [studentsData]);

    const handleDownloadPDF = async (isSummary: boolean = false, forceAllClasses: boolean = false) => {
        setIsDownloading(true);
        const toastId = toast.loading(isSummary ? (forceAllClasses ? "جاري تحضير ملخص جميع الطلاب..." : "جاري تحضير ملخص طلاب الفصل...") : "جاري تحضير تقرير الطالب...");
        try {
            // Get chart image if it exists
            const chartCanvas = document.querySelector('canvas');
            const chartBase64 = chartCanvas ? chartCanvas.toDataURL('image/png') : undefined;

            const { blob, filename } = await examsApi.downloadStudentProgressPdf({
                studentId: !isSummary ? (selectedStudentId !== "all" ? parseInt(selectedStudentId) : undefined) : undefined,
                classId: forceAllClasses ? undefined : (selectedClassId !== "all" ? parseInt(selectedClassId) : undefined),
                progressChartBase64: chartBase64
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || "تقرير.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("تم تحميل الملف بنجاح", { id: toastId });
        } catch (error) {
            console.error("PDF download failed:", error);
            toast.error("فشل تحميل الملف", { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    const progressChartData = React.useMemo(() => {
        if (!progress || !progress.examSummaries) return null;
        const summaries = [...progress.examSummaries].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate average goal success rate per exam
        const goalAchievements = summaries.map((s: any) => {
            if (!s.goalAnalysis || s.goalAnalysis.length === 0) return 0;
            const total = s.goalAnalysis.reduce((acc: number, goal: any) => acc + goal.successRate, 0);
            return s.goalAnalysis.length > 0 ? (total / s.goalAnalysis.length) : 0;
        });

        return {
            labels: summaries.map((s: any) => s.examTitle),
            datasets: [
                {
                    type: 'line' as const,
                    label: 'درجة الطالب الفعلية',
                    data: summaries.map((s: any) => s.percentage),
                    borderColor: '#0f8b4c',
                    backgroundColor: 'rgba(15, 139, 76, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#0f8b4c',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.4,
                    order: 1
                },
                {
                    type: 'line' as const,
                    label: 'متوسط الأهداف المطلوبة',
                    data: goalAchievements,
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.4,
                    order: 2
                }
            ]
        };
    }, [progress]);


    // Group recurring goals across all exams
    const recurringGoals = React.useMemo(() => {
        if (!progress || !progress.examSummaries) return [];
        const goalMap = new Map<string, { examTitle: string, successRate: number, date: string }[]>();

        // Reverse to get chronological order (oldest to newest)
        const summaries = [...progress.examSummaries].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        summaries.forEach(exam => {
            if (exam.goalAnalysis) {
                exam.goalAnalysis.forEach((goal: any) => {
                    const existing = goalMap.get(goal.goalText) || [];
                    existing.push({
                        examTitle: exam.examTitle,
                        successRate: goal.successRate,
                        date: exam.date
                    });
                    goalMap.set(goal.goalText, existing);
                });
            }
        });

        // Filter for goals that appear in at least 2 exams to show "evolution"
        return Array.from(goalMap.entries())
            .filter(([_, history]) => history.length > 1)
            .map(([text, history]) => ({
                goalText: text,
                history,
                currentRate: history[history.length - 1].successRate,
                previousRate: history[history.length - 2].successRate,
                improvement: history[history.length - 1].successRate - history[history.length - 2].successRate
            })).sort((a, b) => b.history.length - a.history.length);
    }, [progress]);

    const recurringGoalsChartData = React.useMemo(() => {
        if (!recurringGoals || recurringGoals.length === 0) return null;
        const topGoals = recurringGoals.slice(0, 6); // Top 6 for clarity

        return {
            labels: topGoals.map(g => g.goalText.length > 25 ? g.goalText.substring(0, 25) + '...' : g.goalText),
            datasets: [
                {
                    label: 'المستوى الابتدائي (%)',
                    data: topGoals.map(g => g.history[0].successRate),
                    backgroundColor: 'rgba(148, 163, 184, 0.5)', // slate-400
                    borderColor: 'rgb(148, 163, 184)',
                    borderWidth: 1,
                    borderRadius: 6,
                },
                {
                    label: 'المستوى الحالي (%)',
                    data: topGoals.map(g => g.currentRate),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1,
                    borderRadius: 6,
                }
            ]
        };
    }, [recurringGoals]);

    const recurringGoalsChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x' as const, // Vertical bar chart
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: "rgba(148,163,184,0.1)" },
                ticks: {
                    font: { family: 'Cairo', size: 10 },
                    callback: (value: any) => value + '%'
                }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { family: 'Cairo', size: 9, weight: 'bold' as const },
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        },
        plugins: {
            legend: {
                position: 'top' as const,
                rtl: true,
                labels: { font: { family: 'Cairo', size: 11, weight: 'bold' as const } }
            },
            tooltip: {
                rtl: true,
                titleFont: { family: 'Cairo', size: 12 },
                bodyFont: { family: 'Cairo', size: 11 }
            }
        }
    };

    const progressChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: "rgba(148,163,184,0.1)" },
                ticks: {
                    font: { family: 'Cairo', size: 11 },
                    callback: (value: any) => value + '%'
                }
            },
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Cairo', size: 11, weight: 'bold' as const } }
            }
        },
        plugins: {
            legend: {
                position: 'top' as const,
                rtl: true,
                labels: { font: { family: 'Cairo', size: 11, weight: 'bold' as const } }
            },
            tooltip: {
                rtl: true,
                titleFont: { family: 'Cairo', size: 12 },
                bodyFont: { family: 'Cairo', size: 11 },
                callbacks: {
                    label: function (context: any) {
                        return `${context.dataset.label}: ${context.parsed.y}%`;
                    }
                }
            }
        },
        interaction: { intersect: false, mode: 'index' as const }
    };

    return (
        <MainLayout title="تقارير الطلاب" currentPath="/reports/student-report">
            <div className="student-report-container" dir="rtl">
                {/* Header */}
                <div className="report-header-section">
                    <div>
                        <Button
                            variant="ghost"
                            className="mb-2 -mr-2 text-muted-foreground hover:text-primary"
                            onClick={() => navigate("/reports")}
                        >
                            <ArrowLeft className="ml-2 h-3.5 w-3.5" />
                            العودة للتقارير
                        </Button>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">تقرير الطالب</h1>
                        <p className="text-muted-foreground mt-1 font-bold">تتبع رحلة الطالب التعليمية وأداءه المستمر</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary gap-2 font-black"
                            onClick={() => handleDownloadPDF(true, true)}
                            disabled={isDownloading}
                        >
                            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            تحميل ملخص جميع الطلاب (PDF)
                        </Button>
                        {selectedStudentId !== "all" && (
                            <Button
                                className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 font-black"
                                onClick={() => handleDownloadPDF(false)}
                                disabled={isDownloading}
                            >
                                {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDownloader className="h-3.5 w-3.5" />}
                                تحميل تقرير الطالب (PDF)
                            </Button>
                        )}
                    </div>
                </div>


                {/* Selection Section */}
                <Card className="selection-card-premium">
                    <CardHeader className="pb-3 px-8 pt-8">
                        <CardTitle className="text-lg flex items-center gap-3 font-black text-slate-800">
                            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/5 shadow-inner">
                                <ChartIcon className="h-5 w-5 text-primary" />
                            </div>
                            تخصيص نطاق التقرير للمتابعة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Class Selector */}
                            <div className="w-full md:w-[300px] space-y-2">
                                <label className="text-xs font-black text-slate-400 mr-1 flex items-center gap-2">
                                    <BarChart className="h-3 w-3" />
                                    الفصل
                                </label>
                                <div className="flex items-center gap-2 px-4 py-1 bg-white rounded-2xl border border-primary/10 shadow-sm hover:border-primary/30 transition-all group h-14">
                                    <BarChart className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex-1">
                                        <Select
                                            value={selectedClassId}
                                            onValueChange={(val) => {
                                                setSelectedClassId(val);
                                                setSelectedStudentId("all"); // Reset student when class changes
                                            }}
                                        >
                                            <SelectTrigger dir="rtl" className="w-full border-none shadow-none bg-transparent focus:ring-0 px-0 h-10 text-md font-bold">
                                                <SelectValue placeholder="جميع الفصول" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-primary/10 shadow-2xl" dir="rtl">
                                                <SelectItem value="all" className="font-black text-primary">جميع الفصول</SelectItem>
                                                {classesLoading ? (
                                                    <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                                                ) : (
                                                    classes.map((cls: any) => (
                                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                                            {cls.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {selectedClassId !== "all" && (
                                        <Button
                                            variant="outline"
                                            className="h-10 px-4 rounded-xl text-primary border-primary/20 hover:bg-primary/5 transition-all font-black gap-2"
                                            onClick={() => handleDownloadPDF(true)}
                                            disabled={isDownloading}
                                        >
                                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                            تحميل ملخص الفصل
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Student Selector */}
                            <div className="w-full md:w-[450px] space-y-2">
                                <label className="text-xs font-black text-slate-400 mr-1 flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    الطالب
                                </label>
                                <div className="flex items-center gap-2 px-4 py-1 bg-white rounded-2xl border border-primary/10 shadow-sm hover:border-primary/30 transition-all group h-14">
                                    <Users className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex-1">
                                        <Select
                                            value={selectedStudentId}
                                            onValueChange={setSelectedStudentId}
                                        >
                                            <SelectTrigger dir="rtl" className="w-full border-none shadow-none bg-transparent focus:ring-0 px-0 h-10 text-md font-bold">
                                                <SelectValue placeholder="جميع الطلاب" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-80 rounded-2xl border-primary/10 shadow-2xl p-0" dir="rtl">
                                                <div className="p-2">
                                                    <SelectItem value="all" className="font-black text-primary py-4 px-4 rounded-xl mb-1">جميع الطلاب</SelectItem>
                                                    <div className="h-px bg-slate-100 my-1 mx-2" />
                                                    {studentsLoading ? (
                                                        <div className="p-10 text-center">
                                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-30" />
                                                            <p className="text-sm text-slate-400 mt-3 font-black">جاري جلب القائمة...</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {filteredStudents.map((student) => (
                                                                <SelectItem key={student.id.toString()} value={student.id.toString()} className="cursor-pointer py-4 focus:bg-primary/5 rounded-xl mx-1 my-1">
                                                                    <div className="flex flex-col items-start text-right w-full">
                                                                        <span className="font-black text-slate-800 text-md">{student.fullName}</span>
                                                                        <span className="text-xs font-bold text-primary/70">{student.className || "بدون فصل"}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                            {filteredStudents.length === 0 && (
                                                                <div className="p-10 text-center">
                                                                    <Users className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                                                                    <p className="text-sm text-slate-400 font-black">لا يوجد طلاب في هذا الفصل</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {reportScope === "student" && selectedStudentId !== null && progress && !progressLoading && (
                            <div className="student-summary-banner animate-in zoom-in-95 duration-500">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                    <Users className="h-20 w-20 text-emerald-600" />
                                </div>
                                <div className="student-initials-box">
                                    <Users className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-xl tracking-tight text-slate-800">{progress?.studentName}</h3>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm">نشط</span>
                                    </div>
                                    <p className="text-md font-bold text-emerald-600/80">{progress?.className}</p>
                                </div>
                                <div className="mr-auto relative z-10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-black px-4"
                                        onClick={() => setSelectedStudentId("all")}
                                    >
                                        تغيير الطالب
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Content Area */}
                <div className="flex-1 min-h-[400px]">
                    {progressLoading || summaryLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-8">
                            <div className="relative">
                                <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-700 text-xl font-black mb-2 animate-pulse">جاري تحليل مسار الطالب...</p>
                                <p className="text-slate-400 font-bold">نقوم بمعالجة نتائج الاختبارات والتقييمات...</p>
                            </div>
                        </div>
                    ) : reportScope !== "student" ? (
                        <div className="grid gap-8 animate-in fade-in duration-700 slide-in-from-bottom-8 mt-8">
                            <Card className="report-main-card">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 mx-8 px-0 pb-6 pt-10">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black tracking-tight text-slate-800">ملخص أداء الطلاب</CardTitle>
                                        <CardDescription className="font-bold text-slate-400 text-lg">
                                            {reportScope === "class" ? `إحصائيات الأداء لطلاب فصل ${classes.find(c => c.id.toString() === selectedClassId)?.name || ""}` : "إحصائيات الأداء لجميع الطلاب"}
                                        </CardDescription>
                                    </div>
                                    <div className="h-16 w-16 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm shadow-slate-100/50">
                                        <Users className="h-8 w-8 text-slate-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="exam-table-container">
                                        <table className="exam-table-premium">
                                            <thead>
                                                <tr>
                                                    <th>الطالب</th>
                                                    <th className="text-center">الفصل</th>
                                                    <th className="text-center">المستوى</th>
                                                    <th className="text-center">المتوسط</th>
                                                    <th className="text-center">عدد الاختبارات</th>
                                                    <th>الإجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {summaryData?.map((student: any) => (
                                                    <tr key={student.studentId} className="hover:bg-emerald-50/30 transition-all group">
                                                        <td className="px-10 py-6 font-black text-slate-800 text-base">
                                                            {student.studentName}
                                                        </td>
                                                        <td className="px-6 py-6 text-center font-bold text-slate-500">
                                                            {student.className}
                                                        </td>
                                                        <td className="px-6 py-6 text-center">
                                                            <span className={cn(
                                                                "px-3 py-1 rounded-full text-xs font-black",
                                                                student.overallAverage >= 85 ? "bg-emerald-100 text-emerald-700" :
                                                                    student.overallAverage >= 70 ? "bg-blue-100 text-blue-700" :
                                                                        student.overallAverage >= 50 ? "bg-amber-100 text-amber-700" :
                                                                            "bg-rose-100 text-rose-700"
                                                            )}>
                                                                {student.performanceLevel}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-6 text-center font-black text-emerald-600">
                                                            %{student.overallAverage.toFixed(1)}
                                                        </td>
                                                        <td className="px-6 py-6 text-center font-bold text-slate-400">
                                                            {student.examCount ?? student.ExamCount ?? 0}
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-primary font-bold hover:bg-primary/10 rounded-lg"
                                                                onClick={() => {
                                                                    setSelectedStudentId(student.studentId.toString());
                                                                }}
                                                            >
                                                                عرض التفاصيل
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!summaryData || summaryData.length === 0) && (
                                                    <tr>
                                                        <td colSpan={6} className="px-12 py-32 text-center bg-slate-50/40 rounded-b-[3rem]">
                                                            <div className="flex flex-col items-center justify-center gap-6">
                                                                <div className="h-20 w-20 rounded-2xl bg-white shadow-xl flex items-center justify-center opacity-40">
                                                                    <Users className="h-10 w-10 text-slate-200" />
                                                                </div>
                                                                <h4 className="text-xl font-black text-slate-400 tracking-tight">لا توجد بيانات متاحة حالياً</h4>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : !selectedStudentId ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center rounded-[3rem] bg-slate-50/50 border-2 border-dashed border-slate-200/60 mt-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white opacity-50" />
                            <div className="relative z-10 box-content">
                                <div className="h-24 w-24 rounded-[1.5rem] bg-white shadow-2xl shadow-slate-200 flex items-center justify-center mb-6 rotate-3 mx-auto group-hover:rotate-0 transition-transform duration-500">
                                    <ChartIcon className="h-12 w-12 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-700 tracking-tight">استكشف تطور الطالب </h3>
                                <p className="text-slate-400 mt-4 max-w-sm font-bold text-base leading-relaxed mx-auto">
                                    اختر الطالب من القائمة أعلاه لعرض تقرير الأداء الشامل والنمو الأكاديمي والمهاري
                                </p>
                            </div>
                        </div>
                    ) : selectedStudentId !== null && progress ? (
                        <div className="grid gap-8 animate-in fade-in duration-700 slide-in-from-bottom-8 mt-8">
                            {/* Status Cards */}
                            <div className="status-cards-grid">
                                <Card className="card-status-primary">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 -mr-3 -mt-3">
                                        <Award className="h-10 w-10" />
                                    </div>
                                    <CardHeader className="pb-0 pt-3 px-4">
                                        <CardDescription className="text-white/60 font-black text-[9px] uppercase tracking-widest">المستوى العام</CardDescription>
                                        <CardTitle className="text-xl font-black tracking-tight mt-0.5">{progress.performanceLevel}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-3 mt-1">
                                        <div className="bg-white/10 backdrop-blur-xl inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/20 text-[9px] font-black shadow-lg">
                                            <Calendar className="h-3 w-3" />
                                            بناءً على {progress.examSummaries.length} اختبارات سابقة
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="card-status-secondary">
                                    <CardHeader className="pb-0 pt-3 px-4">
                                        <CardDescription className="font-black text-slate-400 text-[9px] uppercase tracking-widest">المتوسط التراكمي</CardDescription>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <CardTitle className="text-2xl font-black text-emerald-600 tracking-tighter">{progress.overallAverage.toFixed(0)}%</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-3 mt-1">
                                        <div className="w-full h-2 bg-slate-100 rounded-full mt-1 overflow-hidden shadow-inner border border-slate-200">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm"
                                                style={{ width: `${progress.overallAverage}%` }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="card-status-secondary">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 -mr-3 -mt-3">
                                        <TrendingUp className="h-10 w-10 text-emerald-600" />
                                    </div>
                                    <CardHeader className="pb-0 pt-3 px-4">
                                        <CardDescription className="font-black text-slate-400 text-[9px] uppercase tracking-widest">إجمالي التقييمات</CardDescription>
                                        <CardTitle className="text-2xl font-black text-slate-700 tracking-tighter mt-0.5">{progress.examSummaries.length}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-3 mt-1">
                                        <p className="text-[9px] text-slate-400 font-bold leading-tight">
                                            عدد الاختبارات والتقييمات التي تم رصدها للطالب خلال العام الدراسي الحالي
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Performance Progress Chart & Insights */}
                            {progressChartData && (
                                <div className="grid gap-8">
                                    <Card className="report-main-card">
                                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 mx-10 px-0 pb-7 pt-10">
                                            <div className="space-y-1">
                                                <CardTitle className="text-2xl font-black tracking-tight text-slate-800">منحنى تطور الأداء</CardTitle>
                                                <CardDescription className="font-bold text-slate-400 text-lg">تحليل تاريخي لتذبذب ونمو مستوى الطالب عبر الاختبارات</CardDescription>
                                            </div>
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-100/50">
                                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-10">
                                            <div ref={chartContainerRef} className="chart-wrapper-premium">
                                                <Chart type="line" data={progressChartData} options={progressChartOptions} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Skills Evolution Analysis */}
                                    {recurringGoals.length > 0 && (
                                        <Card className="report-main-card">
                                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 mx-8 px-0 pb-5 pt-8">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-2xl font-black tracking-tight text-slate-800">تطور المهارات المتكررة</CardTitle>
                                                    <CardDescription className="font-bold text-slate-400 text-lg">تحليل استقرار وإتقان المهارات التي تم قياسها في أكثر من تقييم</CardDescription>
                                                </div>
                                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-100/50">
                                                    <BarChart className="h-6 w-6 text-emerald-600" />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-10">
                                                {recurringGoalsChartData && (
                                                    <div className="mb-12 p-6 rounded-3xl bg-slate-50/50 border border-slate-100 shadow-inner h-[350px]">
                                                        <Chart type="bar" data={recurringGoalsChartData} options={recurringGoalsChartOptions} />
                                                    </div>
                                                )}
                                                <div className="skills-evolution-grid">
                                                    {recurringGoals.map((goal, idx) => (
                                                        <div key={`recurring-${idx}`} className="skill-evolution-item group">
                                                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <div className="flex justify-between items-start mb-6 gap-4 relative z-10">
                                                                <h4 className="font-black text-slate-700 text-md leading-relaxed line-clamp-2 h-12 w-2/3" title={goal.goalText}>
                                                                    {goal.goalText}
                                                                </h4>
                                                                <div className={cn(
                                                                    "flex flex-col items-end px-3 py-2 rounded-2xl shadow-sm",
                                                                    goal.improvement > 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : goal.improvement < 0 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-white text-slate-400 border border-slate-100"
                                                                )}>
                                                                    <span className="text-sm font-black flex items-center gap-1">
                                                                        {goal.improvement > 0 ? "+" : ""}{goal.improvement.toFixed(0)}%
                                                                        {goal.improvement > 0 ? <TrendingUp className="h-4 w-4" /> : goal.improvement < 0 ? <TrendingUp className="h-4 w-4 rotate-180" /> : null}
                                                                    </span>
                                                                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">تغير النسبة</span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4 relative z-10">
                                                                <div className="flex justify-between text-xs font-black text-slate-400">
                                                                    <span>إتقان المهارة حالياً</span>
                                                                    <span className="text-slate-800 text-lg">{goal.currentRate.toFixed(0)}%</span>
                                                                </div>
                                                                <div className="w-full h-3 bg-slate-200/40 rounded-full overflow-hidden p-1 shadow-inner">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                                                                            goal.currentRate >= 80 ? "bg-gradient-to-l from-emerald-500 to-emerald-400" :
                                                                                goal.currentRate >= 50 ? "bg-gradient-to-l from-primary to-emerald-400" :
                                                                                    "bg-gradient-to-l from-rose-500 to-rose-400"
                                                                        )}
                                                                        style={{ width: `${goal.currentRate}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-wrap gap-2 mt-6">
                                                                    {goal.history.slice(-3).map((h, hIdx) => (
                                                                        <div
                                                                            key={hIdx}
                                                                            className="px-3 py-2 rounded-2xl bg-white border border-slate-100 text-[10px] font-black text-slate-500 flex flex-col items-center gap-1 hover:border-emerald-300 hover:text-emerald-600 transition-all cursor-default shadow-sm group/item"
                                                                            title={h.examTitle}
                                                                        >
                                                                            <span className="text-md text-emerald-600 group-hover/item:scale-110 transition-transform">{h.successRate.toFixed(0)}%</span>
                                                                            <span className="opacity-40 line-clamp-1 w-14 text-center text-[9px] font-bold uppercase tracking-tighter">{h.examTitle}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Exam Table */}
                            <Card className="report-main-card">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 mx-8 px-0 pb-6 pt-10">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black tracking-tight text-slate-800">سجل التقييمات التفصيلي</CardTitle>
                                        <CardDescription className="font-bold text-slate-400 text-lg">استعراض شامل لنتائج جميع الاختبارات المسجلة للطالب والتحليل المهاري المصاحب لها</CardDescription>
                                    </div>
                                    <div className="h-16 w-16 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm shadow-slate-100/50">
                                        <Calendar className="h-8 w-8 text-slate-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="exam-table-container">
                                        <table className="exam-table-premium">
                                            <thead>
                                                <tr>
                                                    <th> الاختبار</th>
                                                    <th className="text-center">الدرجة</th>
                                                    <th className="text-center">النسبة</th>
                                                    <th>التاريخ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {progress.examSummaries.map((exam: any) => (
                                                    <React.Fragment key={exam.examId}>
                                                        <tr className="hover:bg-emerald-50/30 transition-all group cursor-default">
                                                            <td className="px-10 py-6 font-black text-slate-800 text-base group-hover:text-emerald-700 transition-colors">
                                                                {exam.examTitle}
                                                            </td>
                                                            <td className="px-12 py-8 text-center text-xl font-bold">
                                                                <span className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-white text-emerald-700 font-black border-2 border-emerald-100 shadow-sm shadow-emerald-100/20 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
                                                                    {exam.score} / {exam.totalScore}
                                                                </span>
                                                            </td>
                                                            <td className="px-12 py-8">
                                                                <div className="flex flex-col items-center gap-3 min-w-[200px]">
                                                                    <span className={cn(
                                                                        "font-black text-xl tracking-tighter",
                                                                        exam.percentage >= 80 ? "text-emerald-500" :
                                                                            exam.percentage >= 50 ? "text-primary" : "text-rose-500"
                                                                    )}>
                                                                        {exam.percentage.toFixed(0)}%
                                                                    </span>
                                                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                                                                        <div
                                                                            className={cn(
                                                                                "h-full rounded-full transition-all duration-1000 shadow-sm",
                                                                                exam.percentage >= 80 ? "bg-emerald-500" :
                                                                                    exam.percentage >= 50 ? "bg-primary" : "bg-rose-500"
                                                                            )}
                                                                            style={{ width: `${exam.percentage}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-12 py-8 text-slate-400 font-black text-md">
                                                                {formatArabicDateOnly(new Date(exam.date))}
                                                            </td>
                                                        </tr>
                                                        {exam.goalAnalysis && exam.goalAnalysis.length > 0 && (
                                                            <tr className="bg-slate-50/20">
                                                                <td colSpan={4} className="px-6 py-6">
                                                                    <div className="grid gap-4 md:grid-cols-2">
                                                                        {/* Strengths */}
                                                                        <div className="analysis-card-premium h-fit">
                                                                            <div className="analysis-header-strength" dir="rtl">
                                                                                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                                                                <h5 className="text-xs font-black text-slate-800">نقاط القوة (فوق 50%)</h5>
                                                                                <span className="mr-auto text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                                                                                    {exam.goalAnalysis.filter((g: any) => g.successRate >= 50).length} مهارات
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-col divide-y px-3 py-1" dir="rtl">
                                                                                {exam.goalAnalysis.filter((g: any) => g.successRate >= 50).map((goal: any, index: number) => (
                                                                                    <div key={`strength-${index}`} className="flex items-center gap-3 py-2">
                                                                                        <div className="flex flex-col flex-1 gap-0.5">
                                                                                            <span className="text-[13px] font-bold text-slate-700 text-right">{goal.goalText}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${goal.successRate}%` }} />
                                                                                            </div>
                                                                                            <span className="text-[11px] font-black text-emerald-600 w-7 text-left">%{goal.successRate.toFixed(0)}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                                {exam.goalAnalysis.filter((g: any) => g.successRate >= 50).length === 0 && (
                                                                                    <div className="py-4 text-center">
                                                                                        <p className="text-[11px] text-slate-400 italic font-black">لا توجد نقاط قوة مسجلة</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Weaknesses */}
                                                                        <div className="analysis-card-premium h-fit">
                                                                            <div className="analysis-header-weakness" dir="rtl">
                                                                                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                                                                                <h5 className="text-xs font-black text-slate-800">توصيات للتطوير (أقل من 50%)</h5>
                                                                                <span className="mr-auto text-[10px] font-black bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full">
                                                                                    {exam.goalAnalysis.filter((g: any) => g.successRate < 50).length} مهارات
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-col divide-y px-3 py-1" dir="rtl">
                                                                                {exam.goalAnalysis.filter((g: any) => g.successRate < 50).map((goal: any, index: number) => (
                                                                                    <div key={`weakness-${index}`} className="flex items-center gap-3 py-2">
                                                                                        <div className="flex flex-col flex-1 gap-0.5">
                                                                                            <span className="text-[13px] font-bold text-slate-700 text-right">{goal.goalText}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${goal.successRate}%` }} />
                                                                                            </div>
                                                                                            <span className="text-[11px] font-black text-rose-600 w-7 text-left">%{goal.successRate.toFixed(0)}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                                {exam.goalAnalysis.filter((g: any) => g.successRate < 50).length === 0 && (
                                                                                    <div className="py-4 text-center">
                                                                                        <p className="text-[11px] text-slate-400 italic font-black">أداء مستقر في جميع المهارات</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                                {progress.examSummaries.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-12 py-32 text-center bg-slate-50/40 rounded-b-[3rem]">
                                                            <div className="flex flex-col items-center justify-center gap-6">
                                                                <div className="h-20 w-20 rounded-2xl bg-white shadow-xl flex items-center justify-center rotate-6 scale-90 opacity-40">
                                                                    <Calendar className="h-10 w-10 text-slate-200" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xl font-black text-slate-400 tracking-tight">لا يوجد سجل بيانات حالي</h4>
                                                                    <p className="text-slate-300 max-w-xs font-bold text-base leading-relaxed mx-auto mt-2">بمجرد قيام الطالب بالاختبارات، ستظهر النتائج والتحليلات هنا تلقائياً</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : selectedStudentId !== null && progressError ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center bg-rose-50/40 rounded-[3rem] border-2 border-dashed border-rose-200/50 mt-8 backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/20" />
                            <div className="relative z-10">
                                <div className="h-24 w-24 rounded-2xl bg-white shadow-xl shadow-rose-200 flex items-center justify-center mb-6 mx-auto -rotate-3 group-hover:rotate-0 transition-transform">
                                    <AlertCircle className="h-12 w-12 text-rose-500" />
                                </div>
                                <h3 className="text-2xl font-black text-rose-800 tracking-tight mb-3">نعتذر، حدثت مشكلة تقنية</h3>
                                <p className="text-rose-600/70 max-w-md font-black text-lg leading-relaxed mx-auto">
                                    {(progressError as any)?.message || "تعذر تحميل وتحليل بيانات الطالب حالياً، يرجى التحقق من الاتصال أو المحاولة لاحقاً"}
                                </p>
                                <Button
                                    className="mt-8 rounded-2xl bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200 px-8 py-6 text-lg font-black border-4 border-rose-400/20 transition-all hover:scale-105 active:scale-95"
                                    onClick={() => setSelectedStudentId(selectedStudentId)}
                                >
                                    محاولة استعادة البيانات
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <HelpFab
                    title="دليل تقارير الطلاب التراكمية"
                    description="توفر هذه الصفحة عرضاً شاملاً لمستوى الطالب عبر جميع الاختبارات السابقة."
                    tooltip="دليل تقارير الطلاب"
                >
                    <div className="space-y-4">
                        <p className="text-muted-foreground font-bold">المميزات الرئيسية:</p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
                            <li><strong>تصفية النتائج:</strong> يمكنك عرض إحصائيات فصل كامل أو اختيار طالب محدد لمتابعة تفاصيله.</li>
                            <li><strong>المتوسط التراكمي:</strong> يمثل الدرجة المتوسطة للطالب في كافة الاختبارات التي خاضها.</li>
                            <li><strong>منحنى تطور الأداء:</strong> رسم بياني يوضح اتجاه مستوى الطالب (صعوداً أو هبوطاً) عبر الزمن.</li>
                            <li><strong>إتقان المهارات:</strong> تحليل دقيق لمدى تمكن الطالب من الأهداف التعليمية المختلفة.</li>
                        </ul>
                        <p className="text-sm border-t pt-2 mt-4 text-primary font-bold">يمكنك تحميل التقرير التراكمي الشامل للفصل أو للطالب بصيغة PDF من الأعلى.</p>
                    </div>
                </HelpFab>
            </div>
        </MainLayout>
    );
}
