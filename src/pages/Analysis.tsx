import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import "./Analysis.css";
import {
    FileText,
    BarChart3,
    User,
    Printer,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    Download,
    Loader2,
    CheckSquare,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpFab } from "@/components/ui/help-fab";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement,
    RadialLinearScale,
    Filler
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import html2canvas from "html2canvas";

const scrollStyle = `
  .small-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
  .small-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .small-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`;
import { examsApi } from "@/lib/exams-api";
import { useGetClassReport, useGetStudentReport, useGetExamPapers } from "@/hooks/use-analysis";
import { useGetExams } from "@/hooks/use-exams";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    RadialLinearScale,
    Filler,
    Title,
    Tooltip,
    Legend
);

export default function Analysis() {
    return (
        <>
            <style>{scrollStyle}</style>
            <AnalysisContent />
        </>
    );
}

function AnalysisContent() {
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [selectedPaperId, setSelectedPaperId] = useState<string>("");
    const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState("class");
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
    const radarChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);
    const strengthRadarChartRef = useRef<HTMLDivElement>(null);
    const weaknessRadarChartRef = useRef<HTMLDivElement>(null);
    const classStrengthRadarChartRef = useRef<HTMLDivElement>(null);
    const classWeaknessRadarChartRef = useRef<HTMLDivElement>(null);
    const classQuestionBarChartRef = useRef<HTMLDivElement>(null);

    // Dedicated refs for PDF capture (hidden)
    const studentRadarCaptureRef = useRef<HTMLDivElement>(null);
    const studentStrengthRadarCaptureRef = useRef<HTMLDivElement>(null);
    const studentWeaknessRadarCaptureRef = useRef<HTMLDivElement>(null);


    const { data: exams, isLoading: isLoadingExams } = useGetExams();
    const { data: examPapers } = useGetExamPapers(
        selectedExamId ? parseInt(selectedExamId) : null
    );

    const { data: classReport, isLoading: isLoadingReport } = useGetClassReport(
        selectedExamId ? parseInt(selectedExamId) : null,
        selectedClassId ? (examPapers?.find((p: any) => p.className === selectedClassId)?.classId || undefined) : undefined
    );

    const { data: studentReport, isLoading: isLoadingStudent } = useGetStudentReport(
        selectedPaperId ? parseInt(selectedPaperId) : null
    );
    const selectedExam = exams?.find((e: any) => e.id.toString() === selectedExamId);

    const displayClassName = useMemo(() => {
        if (selectedClassId && selectedClassId !== "all") {
            return selectedClassId;
        }
        const classes = Array.from(new Set(examPapers?.map((p: any) => p.className).filter(Boolean)));
        return classes.length > 0 ? classes.join(" - ") : "جميع الفصول";
    }, [selectedClassId, examPapers]);

    const classPerformanceData = useMemo(() => {
        if (!classReport?.goalAnalysis) return { labels: [], datasets: [] };
        return {
            labels: classReport.goalAnalysis.map((g: any) => g.goalText),
            datasets: [{
                label: 'متوسط أداء الفصل (%)',
                data: classReport.goalAnalysis.map((g: any) => g.successRate),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            }]
        };
    }, [classReport]);

    const radarData = useMemo(() => {
        if (!studentReport?.goalAnalysis) return { labels: [], datasets: [] };

        const classAverages = studentReport.goalAnalysis.map((stGoal: any) => {
            const classGoal = classReport?.goalAnalysis?.find((cg: any) => cg.goalText === stGoal.goalText);
            return classGoal ? classGoal.successRate : 0;
        });

        return {
            labels: studentReport.goalAnalysis.map((g: any) => g.goalText),
            datasets: [
                {
                    label: "متوسط الفصل",
                    data: classAverages,
                    backgroundColor: "rgba(244, 114, 182, 0.45)",
                    borderColor: "#f472b6",
                    pointBackgroundColor: "#fff",
                    pointBorderColor: "#f472b6",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    order: 2
                },
                {
                    label: "أداء الطالب",
                    data: studentReport.goalAnalysis.map((g: any) => g.successRate),
                    backgroundColor: "rgba(96, 165, 250, 0.45)",
                    borderColor: "#60a5fa",
                    pointBackgroundColor: "#fff",
                    pointBorderColor: "#60a5fa",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    order: 1
                }
            ]
        };
    }, [studentReport, classReport]);

    const strengthRadarData = useMemo(() => {
        if (!studentReport?.goalAnalysis) return { labels: [], datasets: [] };
        const strengths = studentReport.goalAnalysis.filter((g: any) => g.successRate >= 50);

        return {
            labels: strengths.map((g: any) => g.goalText),
            datasets: [
                {
                    label: "أداء الطالب (%)",
                    data: strengths.map((g: any) => g.successRate),
                    backgroundColor: "rgba(45, 212, 191, 0.7)",
                    borderColor: "#2dd4bf",
                    pointBackgroundColor: "#2dd4bf",
                    pointBorderColor: "#fff",
                    fill: true
                }
            ]
        };
    }, [studentReport]);

    const weaknessRadarData = useMemo(() => {
        if (!studentReport?.goalAnalysis) return { labels: [], datasets: [] };
        const weaknesses = studentReport.goalAnalysis.filter((g: any) => g.successRate < 50);

        return {
            labels: weaknesses.map((g: any) => g.goalText),
            datasets: [
                {
                    label: "أداء الطالب (%)",
                    data: weaknesses.map((g: any) => g.successRate),
                    backgroundColor: "rgba(251, 113, 133, 0.4)",
                    borderColor: "#fb7185",
                    borderWidth: 2,
                    pointBackgroundColor: "#fb7185",
                    pointBorderColor: "#fff",
                    pointRadius: 6,
                    pointHoverRadius: 9,
                    fill: true
                }
            ]
        };
    }, [studentReport]);

    const classStrengthRadarData = useMemo(() => {
        if (!classReport?.goalAnalysis) return { labels: [], datasets: [] };
        const strengths = classReport.goalAnalysis.filter((g: any) => g.successRate >= 50);

        return {
            labels: strengths.map((g: any) => g.goalText),
            datasets: [
                {
                    label: "متوسط الفصل (%)",
                    data: strengths.map((g: any) => g.successRate),
                    backgroundColor: "rgba(45, 212, 191, 0.7)",
                    borderColor: "#2dd4bf",
                    pointBackgroundColor: "#2dd4bf",
                    pointBorderColor: "#fff",
                    fill: true
                }
            ]
        };
    }, [classReport]);

    const classWeaknessRadarData = useMemo(() => {
        if (!classReport?.goalAnalysis) return { labels: [], datasets: [] };
        const weaknesses = classReport.goalAnalysis.filter((g: any) => (g?.successRate ?? 0) < 50);

        return {
            labels: weaknesses.map((g: any) => g.goalText),
            datasets: [
                {
                    label: "متوسط الفصل (%)",
                    data: weaknesses.map((g: any) => g.successRate),
                    backgroundColor: "rgba(251, 113, 133, 0.4)",
                    borderColor: "#fb7185",
                    borderWidth: 2,
                    pointBackgroundColor: "#fb7185",
                    pointBorderColor: "#fff",
                    pointRadius: 6,
                    pointHoverRadius: 9,
                    fill: true
                }
            ]
        };
    }, [classReport]);

    const classQuestionBarData = useMemo(() => {
        if (!classReport?.questionAnalysis) return { labels: [], datasets: [] };

        return {
            labels: classReport.questionAnalysis.map((q: any) => q.questionDisplay || `س ${q.questionNumber}`),
            datasets: [
                {
                    label: "نسبة النجاح (%)",
                    data: classReport.questionAnalysis.map((q: any) => q.successRate),
                    backgroundColor: classReport.questionAnalysis.map((q: any) =>
                        q.successRate >= 80 ? 'rgba(34, 197, 94, 0.6)' :
                            q.successRate >= 50 ? 'rgba(234, 179, 8, 0.6)' :
                                'rgba(239, 68, 68, 0.6)'
                    ),
                    borderColor: classReport.questionAnalysis.map((q: any) =>
                        q.successRate >= 80 ? 'rgb(34, 197, 94)' :
                            q.successRate >= 50 ? 'rgb(234, 179, 8)' :
                                'rgb(239, 68, 68)'
                    ),
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        };
    }, [classReport]);

    const handlePrint = () => {
        toast.info("جاري تحضير الملف للطباعة أو الحفظ... يرجى اختيار 'Save as PDF' من نافذة الطباعة", {
            duration: 5000,
        });

        // Give it a small timeout to ensure charts and layouts are stabilized
        setTimeout(() => {
            window.print();
        }, 800);
    };

    const captureRadarChart = async (): Promise<string | null> => {
        const target = studentRadarCaptureRef.current || radarChartRef.current;
        if (!target) return null;
        try {
            const canvas = await html2canvas(target, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);
                        if (style.color?.includes('oklch')) el.style.color = '#000000';
                        if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff';
                        if (style.borderColor?.includes('oklch')) el.style.borderColor = '#cccccc';
                    }
                }
            });
            return canvas.toDataURL("image/png");
        } catch (error) {
            console.error("Error capturing radar chart:", error);
            return null;
        }
    };

    const captureBarChart = async (): Promise<string | null> => {
        if (!barChartRef.current) return null;
        try {
            const canvas = await html2canvas(barChartRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);
                        if (style.color?.includes('oklch')) el.style.color = '#000000';
                        if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff';
                        if (style.borderColor?.includes('oklch')) el.style.borderColor = '#cccccc';
                    }
                }
            });
            return canvas.toDataURL("image/png");
        } catch (error) {
            console.error("Error capturing bar chart:", error);
            return null;
        }
    };

    const captureStrengthRadarChart = async (): Promise<string | null> => {
        const target = studentStrengthRadarCaptureRef.current || strengthRadarChartRef.current;
        if (!target) return null;
        try {
            const canvas = await html2canvas(target, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);
                        if (style.color?.includes('oklch')) el.style.color = '#000000';
                        if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff';
                        if (style.borderColor?.includes('oklch')) el.style.borderColor = '#cccccc';
                    }
                }
            });
            return canvas.toDataURL("image/png");
        } catch (error) {
            console.error("Error capturing strength radar chart:", error);
            return null;
        }
    };

    const captureWeaknessRadarChart = async (): Promise<string | null> => {
        const target = studentWeaknessRadarCaptureRef.current || weaknessRadarChartRef.current;
        if (!target) return null;
        try {
            const canvas = await html2canvas(target, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);
                        if (style.color?.includes('oklch')) el.style.color = '#000000';
                        if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff';
                        if (style.borderColor?.includes('oklch')) el.style.borderColor = '#cccccc';
                    }
                }
            });
            return canvas.toDataURL("image/png");
        } catch (error) {
            console.error("Error capturing weakness radar chart:", error);
            return null;
        }
    };

    const captureClassStrengthRadarChart = async (): Promise<string | null> => {
        if (!classStrengthRadarChartRef.current) return null;
        try {
            const canvas = await html2canvas(classStrengthRadarChartRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);
                        if (style.color?.includes('oklch')) el.style.color = '#000000';
                        if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff';
                        if (style.borderColor?.includes('oklch')) el.style.borderColor = '#cccccc';
                    }
                }
            });
            return canvas.toDataURL("image/png");
        } catch (error) {
            console.error("Error capturing class strength radar chart:", error);
            return null;
        }
    };

    const captureClassWeaknessRadarChart = async (): Promise<string | null> => {
        if (!classWeaknessRadarChartRef.current) return null;
        try {
            const canvas = await html2canvas(classWeaknessRadarChartRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);
                        if (style.color?.includes('oklch')) el.style.color = '#000000';
                        if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff';
                        if (style.borderColor?.includes('oklch')) el.style.borderColor = '#cccccc';
                    }
                }
            });
            return canvas.toDataURL("image/png");
        } catch (error) {
            console.error("Error capturing class weakness radar chart:", error);
            return null;
        }
    };

    const captureClassQuestionBarChart = async (): Promise<string | null> => {
        if (!classQuestionBarChartRef.current) return null;
        try {
            // Wait a bit for Chart.js to initialize and render
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(classQuestionBarChartRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);
                        if (style.color?.includes('oklch')) el.style.color = '#000000';
                        if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff';
                        if (style.borderColor?.includes('oklch')) el.style.borderColor = '#cccccc';
                    }
                }
            });
            return canvas.toDataURL("image/png");
        } catch (error) {
            console.error("Error capturing class question bar chart:", error);
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        setIsDownloadingPDF(true);
        const toastId = toast.loading("جاري تحضير وتحميل التقرير ...", { id: "pdf-download" });

        try {
            if (!selectedExamId) {
                toast.error("يرجى اختيار اختبار أولاً", { id: toastId });
                return;
            }

            // Small delay to ensure all chart animations are settled and fonts are ready
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capture charts based on what's needed
            let barImg = null;
            let radarImg = null;
            let sRadarImg = null;
            let wRadarImg = null;
            let csRadarImg = null;
            let cwRadarImg = null;
            let cqBarImg = null;

            // If we are on Class tab or downloading full report, try to grab the Bar chart
            if (barChartRef.current) {
                barImg = await captureBarChart();
            }
            if (classStrengthRadarChartRef.current) {
                csRadarImg = await captureClassStrengthRadarChart();
            }
            if (classWeaknessRadarChartRef.current) {
                cwRadarImg = await captureClassWeaknessRadarChart();
            }
            if (classQuestionBarChartRef.current) {
                cqBarImg = await captureClassQuestionBarChart();
            }

            // If we have a student selected, grab their specific charts
            if (selectedPaperId) {
                if (radarChartRef.current) radarImg = await captureRadarChart();
                if (strengthRadarChartRef.current) sRadarImg = await captureStrengthRadarChart();
                if (weaknessRadarChartRef.current) wRadarImg = await captureWeaknessRadarChart();
            }

            const { blob, filename } = await examsApi.downloadDetailedAnalysisPdf({
                examId: parseInt(selectedExamId),
                paperId: activeTab === "students" && selectedPaperId ? parseInt(selectedPaperId) : undefined,
                classId: selectedClassId && selectedClassId !== "all" ? (examPapers?.find((p: any) => p.className === selectedClassId)?.classId || undefined) : undefined,
                radarImageBase64: radarImg || undefined,
                barChartImageBase64: barImg || undefined,
                strengthRadarImageBase64: sRadarImg || undefined,
                weaknessRadarImageBase64: wRadarImg || undefined,
                classStrengthRadarImageBase64: csRadarImg || undefined,
                classWeaknessRadarImageBase64: cwRadarImg || undefined,
                questionBarImageBase64: cqBarImg || undefined
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `تحليل_${(selectedExam?.title || 'الاختبار').replace(/[<>:"/\\|?*]/g, '')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("تم تحميل التقرير بنجاح", { id: toastId });
        } catch (error: any) {
            console.error("PDF generation failed:", error);
            toast.error(`حدث خطأ أثناء تحميل التقرير. يرجى التأكد من تشغيل الخادم.`, { id: toastId, duration: 8000 });
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    return (
        <MainLayout>
            <div id="analysis-report-content" className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">تحليل نتائج الاختبارات</h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            نظرة تعمق في أداء الطلاب والتحقق من تحقيق الأهداف التعليمية
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center no-print w-full md:w-auto">
                        {/* Exam Selector */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-2xl border border-border/50 shadow-sm min-w-[240px] md:min-w-[280px] hover:border-primary/30 transition-all">
                            <FileText className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                                <Select value={selectedExamId} onValueChange={(val) => {
                                    setSelectedExamId(val);
                                    setSelectedClassId(undefined);
                                }}>
                                    <SelectTrigger className="h-9 border-none shadow-none bg-transparent focus:ring-0 px-1 text-sm font-bold">
                                        <SelectValue placeholder="اختر الاختبار" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {isLoadingExams ? (
                                            <div className="p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
                                        ) : (
                                            exams?.map((exam) => (
                                                <SelectItem key={exam.id} value={exam.id.toString()} className="rounded-lg">
                                                    {exam.title}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>


                        <div className="flex gap-2 w-full md:w-auto mr-auto md:mr-0">
                            <Button variant="outline" onClick={handlePrint} className="gap-2 h-11 rounded-2xl px-6 border-border/60 hover:bg-muted/80 shadow-sm">
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">طباعة</span>
                            </Button>
                            <Button onClick={handleDownloadPDF} disabled={isDownloadingPDF} className="gap-2 h-11 rounded-2xl px-6 shadow-md hover:shadow-lg transition-all">
                                {isDownloadingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                <span>{isDownloadingPDF ? "جاري التحميل..." : "تحميل PDF"}</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {!selectedExamId ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/50 no-print">
                        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="font-medium text-muted-foreground text-xl">يرجى اختيار اختبار لعرض التحليلات</h3>
                    </div>
                ) : isLoadingReport ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <span className="mr-4 text-xl">جاري تحميل البيانات...</span>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex flex-col gap-6 mb-8 no-print w-full" dir="rtl">
                            {/* Class Selector */}
                            {selectedExamId && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-2xl border border-border/50 shadow-sm min-w-[200px] hover:border-primary/30 transition-all">
                                        <Users className="h-4 w-4 text-primary" />
                                        <div className="flex-1">
                                            <Select
                                                value={selectedClassId || "all"}
                                                onValueChange={(val) => {
                                                    setSelectedClassId(val === "all" ? undefined : val);
                                                    setSelectedPaperId(""); // Reset selected student when class changes
                                                }}
                                            >
                                                <SelectTrigger className="h-9 border-none shadow-none bg-transparent focus:ring-0 px-1 text-sm font-bold">
                                                    <SelectValue placeholder="جميع الفصول" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="all" className="rounded-lg">جميع الفصول</SelectItem>
                                                    {Array.from(new Set(examPapers?.map((p: any) => p.className).filter(Boolean)))
                                                        .map((className: any) => (
                                                            <SelectItem key={className} value={className} className="rounded-lg">
                                                                {className}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center w-full">
                                <TabsList className="bg-transparent border-none p-0 h-auto flex gap-3 flex-wrap">
                                    <TabsTrigger
                                        value="class"
                                        className="data-[state=active]:bg-primary data-[state=active]:text-white border border-border bg-card rounded-full px-6 py-2.5 transition-all flex gap-2 items-center hover:bg-muted"
                                    >
                                        <BarChart3 className="h-4 w-4" />
                                        التقرير الشامل للفصل
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="detailed"
                                        className="data-[state=active]:bg-primary data-[state=active]:text-white border border-border bg-card rounded-full px-6 py-2.5 transition-all flex gap-2 items-center hover:bg-muted"
                                    >
                                        <FileText className="h-4 w-4" />
                                        تحليل تفصيلي للأسئلة
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="students"
                                        className="data-[state=active]:bg-primary data-[state=active]:text-white border border-border bg-card rounded-full px-6 py-2.5 transition-all flex gap-2 items-center hover:bg-muted"
                                    >
                                        <User className="h-4 w-4" />
                                        التقارير الفردية
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        {/* Hidden charts for PDF/Print capture - Rendered off-screen instead of hidden so html2canvas can capture them */}
                        {classReport && (
                            <div className="pointer-events-none fixed -left-[9999px] top-0 no-print z-[-9999]" aria-hidden="true" style={{ width: '800px' }}>
                                {/* Class Radars */}
                                {classStrengthRadarData?.labels?.length > 0 && (
                                    <div ref={classStrengthRadarChartRef} className="w-[800px] h-[600px] bg-white p-10">
                                        <h2 className="text-2xl font-bold mb-6 text-center" dir="rtl">رادار نقاط القوة (متوسط الفصل)</h2>
                                        <Radar data={classStrengthRadarData} options={{ maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { display: true }, pointLabels: { font: { size: 14, family: 'Cairo', weight: 'bold' } } } }, plugins: { legend: { display: false } } }} />
                                    </div>
                                )}
                                {classWeaknessRadarData?.labels?.length > 0 && (
                                    <div ref={classWeaknessRadarChartRef} className="w-[800px] h-[600px] bg-white p-10">
                                        <h2 className="text-2xl font-bold mb-6 text-center" dir="rtl">رادار نقاط الضعف (متوسط الفصل)</h2>
                                        <Radar data={classWeaknessRadarData} options={{ maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { display: true }, pointLabels: { font: { size: 14, family: 'Cairo', weight: 'bold' } } } }, plugins: { legend: { display: false } } }} />
                                    </div>
                                )}

                                {classQuestionBarData?.labels?.length > 0 && (
                                    <div ref={classQuestionBarChartRef} className="w-[1000px] h-[600px] bg-white p-10">
                                        <h2 className="text-2xl font-bold mb-6 text-center" dir="rtl">تحليل أداء الأسئلة</h2>
                                        <div style={{ width: '900px', height: '500px' }}>
                                            <Bar
                                                key={`q-bar-hidden-${classReport?.questionAnalysis?.length || 0}`}
                                                data={classQuestionBarData}
                                                options={{
                                                    animation: false,
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    indexAxis: 'x',
                                                    scales: {
                                                        y: { beginAtZero: true, max: 100, ticks: { font: { family: 'Cairo', size: 14 } } },
                                                        x: { ticks: { font: { family: 'Cairo', size: 12, weight: 'bold' } } }
                                                    },
                                                    plugins: { legend: { display: false } }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Individual Student Radars (Captures currently selected student) */}
                                {studentReport && (
                                    <>
                                        <div ref={studentRadarCaptureRef} className="w-[800px] h-[600px] bg-white p-10">
                                            <h2 className="text-2xl font-bold mb-6 text-center" dir="rtl">الأداء العام للطالب: {studentReport.studentName}</h2>
                                            <Radar data={radarData} options={{ maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { display: true }, pointLabels: { font: { size: 14, family: 'Cairo', weight: 'bold' } } } }, plugins: { legend: { display: false } } }} />
                                        </div>
                                        {strengthRadarData?.labels?.length > 0 && (
                                            <div ref={studentStrengthRadarCaptureRef} className="w-[800px] h-[600px] bg-white p-10">
                                                <h2 className="text-2xl font-bold mb-6 text-center" dir="rtl">رادار نقاط القوة للطالب</h2>
                                                <Radar data={strengthRadarData} options={{ maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { display: true }, pointLabels: { font: { size: 14, family: 'Cairo', weight: 'bold' } } } }, plugins: { legend: { display: false } } }} />
                                            </div>
                                        )}
                                        {weaknessRadarData?.labels?.length > 0 && (
                                            <div ref={studentWeaknessRadarCaptureRef} className="w-[800px] h-[600px] bg-white p-10">
                                                <h2 className="text-2xl font-bold mb-6 text-center" dir="rtl">رادار نقاط الضعف للطالب</h2>
                                                <Radar data={weaknessRadarData} options={{ maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { display: true }, pointLabels: { font: { size: 14, family: 'Cairo', weight: 'bold' } } } }, plugins: { legend: { display: false } } }} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        {/* Class Report Tab */}
                        <TabsContent value="class" className="space-y-6 print:m-0">
                            {/* Class Summary Info Bar */}
                            <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 p-4 md:p-6 md:px-10 bg-card rounded-2xl md:rounded-[2rem] shadow-sm border overflow-visible" dir="rtl">
                                <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full md:w-auto">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">فصل:</span>
                                        <span className="text-base md:text-xl font-black text-foreground">{displayClassName}</span>
                                    </div>
                                    <div className="hidden md:block h-8 w-[1px] bg-border"></div>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">المادة:</span>
                                        <span className="text-base md:text-xl font-black text-foreground">{exams?.find((e: any) => e.id.toString() === selectedExamId)?.subject}</span>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">تاريخ الاختبار:</span>
                                        <span className="text-base md:text-xl font-black text-foreground">
                                            {selectedExam?.createdAt
                                                ? (() => {
                                                    const d = new Date(selectedExam.createdAt);
                                                    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
                                                })()
                                                : "-"
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>


                            <div className="grid gap-6 md:grid-cols-4">
                                <Card className="hover:shadow-md transition-shadow border-r-4 border-r-primary bg-card">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold text-primary">{(classReport?.overallPercentage ?? 0).toFixed(1)}%</div>
                                                <p className="text-sm font-medium text-muted-foreground mt-1">المتوسط العام</p>
                                            </div>
                                            <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
                                                %
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card
                                    className="hover:shadow-md transition-shadow border-r-4 border-r-rose-500 bg-card cursor-pointer group"
                                    onClick={() => setIsInterventionModalOpen(true)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold text-rose-600 group-hover:scale-110 transition-transform">{classReport?.failedStudents ?? 0}</div>
                                                <p className="text-sm font-medium text-muted-foreground mt-1">بحاجة لتدخل</p>
                                            </div>
                                            <div className="p-3 bg-rose-500/10 rounded-xl text-red-600 group-hover:bg-rose-500/20 transition-colors">
                                                <AlertTriangle className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="hover:shadow-md transition-shadow border-r-4 border-r-green-500 bg-card">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold text-green-600">{classReport?.passedStudents ?? 0}</div>
                                                <p className="text-sm font-medium text-muted-foreground mt-1">المجتادين</p>
                                            </div>
                                            <div className="p-3 bg-green-500/10 rounded-xl text-green-600">
                                                <TrendingUp className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-md transition-shadow border-r-4 border-r-blue-500 bg-card">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold">{classReport?.totalStudents}</div>
                                                <p className="text-sm font-medium text-muted-foreground mt-1">إجمالي الطلاب</p>
                                            </div>
                                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                                                <User className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>نظرة عامة على أداء الفصل حسب الأهداف</CardTitle>
                                    <CardDescription>تحليل الأهداف التعليمية للاختبار المحدد</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div ref={barChartRef} className="h-[400px] w-full bg-white p-2">
                                        {classPerformanceData.labels.length > 0 ? (
                                            <Bar
                                                data={classPerformanceData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: { legend: { position: 'bottom' } },
                                                    scales: { y: { min: 0, max: 100 } }
                                                }}
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                                لم يتم العثور على أهداف معرفة لهذا الاختبار
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                                    {/* Card Header */}
                                    <div className="flex items-center gap-3 p-5 border-b bg-accent/10" dir="rtl">
                                        <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                                        <h4 className="text-base font-bold text-foreground">نقاط القوة (فوق 50%)</h4>
                                        <span className="mr-auto text-xs font-bold bg-teal-500/10 text-teal-600 px-2.5 py-1 rounded-full">
                                            {classReport?.goalAnalysis.filter((g: any) => g.successRate >= 50).length} مهارات
                                        </span>
                                    </div>

                                    {/* Skill Rows */}
                                    <div className="flex flex-col divide-y px-5 pt-3 pb-4" dir="rtl">
                                        {classReport?.goalAnalysis
                                            ?.filter((g: any) => g.successRate >= 50)
                                            .sort((a: any, b: any) => b.successRate - a.successRate)
                                            .map((g: any, i: number) => (
                                                <div key={i} className="flex items-center gap-4 py-3">
                                                    <div className="flex flex-col flex-1 gap-0.5">
                                                        <span className="text-sm font-bold text-foreground text-right">{g.goalText}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-teal-400 rounded-full"
                                                                style={{ width: `${g.successRate}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-bold text-teal-600 w-10 text-left">{(g.successRate ?? 0).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        {(classReport?.goalAnalysis?.filter((g: any) => g.successRate >= 50).length ?? 0) === 0 && (
                                            <p className="text-sm text-muted-foreground italic py-4 text-center">لا توجد نقاط قوة مسجلة حتى الآن</p>
                                        )}
                                    </div>
                                    <div className="mt-auto h-[250px] w-full flex items-center justify-center p-4 border-t border-slate-50">
                                        <Radar
                                            data={classStrengthRadarData}
                                            options={{
                                                maintainAspectRatio: false,
                                                scales: {
                                                    r: {
                                                        min: 0,
                                                        max: 100,
                                                        ticks: { display: false },
                                                        grid: { color: "rgba(148,163,184,0.3)" },
                                                        pointLabels: {
                                                            display: true,
                                                            font: { size: 9, family: 'Cairo', weight: 'bold' },
                                                            color: '#334155'
                                                        }
                                                    }
                                                },
                                                plugins: { legend: { display: false } }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden flex flex-col border-b-4 border-b-red-500">
                                    {/* Card Header */}
                                    <div className="flex items-center gap-3 p-5 border-b bg-red-500/10" dir="rtl">
                                        <div className="w-1 h-6 bg-rose-500 rounded-full"></div>
                                        <h4 className="text-base font-bold text-foreground">نقاط الضعف (أقل من 50%)</h4>
                                        <span className="mr-auto text-xs font-bold bg-rose-500/10 text-rose-600 px-2.5 py-1 rounded-full">
                                            {(classReport?.goalAnalysis?.filter((g: any) => g.successRate < 50).length ?? 0)} مهارات
                                        </span>
                                    </div>

                                    {/* Skill Rows */}
                                    <div className="flex flex-col divide-y px-5 pt-3 pb-4" dir="rtl">
                                        {classReport?.goalAnalysis
                                            ?.filter((g: any) => g.successRate < 50)
                                            .sort((a: any, b: any) => a.successRate - b.successRate)
                                            .map((g: any, i: number) => (
                                                <div key={i} className="flex items-center gap-4 py-3">
                                                    <div className="flex flex-col flex-1 gap-0.5">
                                                        <span className="text-sm font-bold text-foreground text-right">{g.goalText}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-rose-400 rounded-full"
                                                                style={{ width: `${g.successRate}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-bold text-rose-600 w-10 text-left">{(g.successRate ?? 0).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        {(classReport?.goalAnalysis?.filter((g: any) => g.successRate < 50).length ?? 0) === 0 && (
                                            <p className="text-sm text-muted-foreground italic py-4 text-center">لا توجد نقاط ضعف مسجلة</p>
                                        )}
                                    </div>
                                    <div className="mt-auto h-[250px] w-full flex items-center justify-center p-4 border-t border-slate-50">
                                        <Radar
                                            data={classWeaknessRadarData}
                                            options={{
                                                maintainAspectRatio: false,
                                                scales: {
                                                    r: {
                                                        min: 0,
                                                        max: 100,
                                                        ticks: { display: false },
                                                        grid: { color: "rgba(148,163,184,0.3)" },
                                                        pointLabels: {
                                                            display: true,
                                                            font: { size: 9, family: 'Cairo', weight: 'bold' },
                                                            color: '#334155'
                                                        }
                                                    }
                                                },
                                                plugins: { legend: { display: false } }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden flex flex-col border-b-4 border-b-purple-500">
                                    {/* Card Header */}
                                    <div className="flex items-center gap-3 p-5 border-b bg-purple-500/10" dir="rtl">
                                        <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                                        <h4 className="text-base font-bold text-foreground">الخطة العلاجية</h4>
                                    </div>

                                    <div className="p-5" dir="rtl">
                                        <div className="bg-muted/50 p-5 rounded-2xl border min-h-[160px]">
                                            {classReport && classReport.goalAnalysis.filter((g: any) => g.successRate < 50).length > 0 ? (
                                                <div className="space-y-3">
                                                    <p className="text-sm font-semibold text-purple-600">
                                                        بناءً على تحليل نتائج الفصل، نوصي بتخصيص وقت إضافي لمعالجة المهارات المتعثرة التالية:
                                                    </p>
                                                    <ul className="list-disc pr-5 space-y-2">
                                                        {classReport.goalAnalysis.filter((g: any) => g.successRate < 50).map((g: any, index: number) => (
                                                            <li key={index} className="text-sm text-purple-700/80 font-medium leading-relaxed">
                                                                {g.goalText} <span className="text-xs opacity-75 mr-1">({g.successRate.toFixed(1)}%)</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <p className="text-base text-muted-foreground leading-relaxed font-medium text-center">
                                                        أداء الفصل متميز جداً ولا توجد أهداف متعثرة تتطلب خطة علاجية عاجلة. نوصي باستمرار تقديم تحديات إثرائية للحفاظ على التفوق.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </TabsContent>

                        {/* Detailed Report Tab */}
                        <TabsContent value="detailed" className="space-y-6 print:m-0">
                            {/* Class Summary Info Bar */}
                            <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 p-4 md:p-6 md:px-10 bg-card rounded-2xl md:rounded-[2rem] shadow-sm border overflow-visible" dir="rtl">
                                <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full md:w-auto">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">فصل:</span>
                                        <span className="text-base md:text-xl font-black text-foreground">{displayClassName}</span>
                                    </div>
                                    <div className="hidden md:block h-8 w-[1px] bg-border"></div>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">المادة:</span>
                                        <span className="text-base md:text-xl font-black text-foreground">{exams?.find((e: any) => e.id.toString() === selectedExamId)?.subject}</span>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">تاريخ الاختبار:</span>
                                        <span className="text-base md:text-xl font-black text-foreground">
                                            {selectedExam?.createdAt
                                                ? (() => {
                                                    const d = new Date(selectedExam.createdAt);
                                                    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
                                                })()
                                                : "-"
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 mb-8">
                                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden flex flex-col border-b-4 border-b-primary">
                                    <div className="flex items-center gap-3 p-5 border-b bg-primary/10" dir="rtl">
                                        <div className="w-1 h-6 bg-primary rounded-full"></div>
                                        <h4 className="text-base font-bold text-foreground">تحليل أداء الأسئلة</h4>
                                        <p className="text-xs text-muted-foreground mr-auto">نسبة النجاح لكل سؤال</p>
                                    </div>
                                    <div className="p-6 bg-white">
                                        <div className="h-[400px] w-full">
                                            <Bar
                                                key={`q-bar-${classReport?.questionAnalysis.length}-vertical`}
                                                data={classQuestionBarData}
                                                options={{
                                                    maintainAspectRatio: false,
                                                    indexAxis: 'x',
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            max: 100,
                                                            grid: { color: "rgba(148,163,184,0.1)" },
                                                            ticks: { font: { family: 'Cairo', size: 10 } }
                                                        },
                                                        x: {
                                                            grid: { display: false },
                                                            ticks: { font: { family: 'Cairo', size: 11, weight: 'bold' } }
                                                        }
                                                    },
                                                    plugins: {
                                                        legend: { display: false },
                                                        tooltip: {
                                                            rtl: true,
                                                            titleFont: { family: 'Cairo' },
                                                            bodyFont: { family: 'Cairo' }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Card className="print-break-inside-auto">
                                <CardHeader>
                                    <CardTitle>تحليل الأسئلة</CardTitle>
                                    <CardDescription>تفصيل أداء الطلاب في كل سؤال من أسئلة الاختبار</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="pb-2 relative w-full rounded-xl border">
                                        <table className="w-full text-right border-collapse">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">التقييم العام</th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center border-l">نسبة النجاح</th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center border-l">الإجابات الصحيحة</th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-l">الهدف المرتبط</th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center border-l">رقم السؤال</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {classReport?.questionAnalysis.map((q: any) => {
                                                    const goal = classReport.goalAnalysis.find((ga: any) => ga.questionNumbers.includes(q.questionNumber));
                                                    return (
                                                        <tr key={q.questionNumber} className="hover:bg-muted/30 transition-colors group">


                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${(q.successRate ?? 0) >= 80 ? "bg-green-100 text-green-700" :
                                                                    (q.successRate ?? 0) >= 50 ? "bg-yellow-100 text-yellow-700" :
                                                                        "bg-red-100 text-red-700"
                                                                    }`}>
                                                                    {(q.successRate ?? 0) >= 80 ? "أداء متميز" : (q.successRate ?? 0) >= 50 ? "أداء مقبول" : "بحاجة لمراجعة"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center border-l">
                                                                <div className="flex items-center gap-2 justify-center">
                                                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden hidden md:block">
                                                                        <div
                                                                            className={`h-full ${(q.successRate ?? 0) >= 80 ? 'bg-green-500' : (q.successRate ?? 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                            style={{ width: `${q.successRate ?? 0}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="font-bold">{(q.successRate ?? 0).toFixed(1)}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center border-l">
                                                                <span className="font-semibold">{q.correctCount}</span>
                                                                <span className="text-muted-foreground mx-1">/</span>
                                                                <span className="text-muted-foreground">{classReport.totalStudents}</span>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium border-l">{goal ? goal.goalText : "-"}</td>
                                                            <td className="px-6 py-4 text-center font-bold text-primary border-l">{q.questionDisplay || `س ${q.questionNumber}`}</td>

                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Individual Report Tab */}
                        <TabsContent value="students" className="space-y-6">
                            <div id="tab-students" className="print-root">
                                <div className="flex flex-wrap items-end justify-start gap-4 mb-8 no-print" dir="rtl">
                                    <div className="space-y-2 w-full md:w-72">
                                        <label className="text-sm font-medium block">اسم الطالب</label>
                                        <Select value={selectedPaperId} onValueChange={setSelectedPaperId}>
                                            <SelectTrigger className="h-11 shadow-sm">
                                                <SelectValue placeholder="اختر اسم الطالب" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {examPapers?.filter((p: any) => !selectedClassId || p.className === selectedClassId).map((paper: any) => (
                                                    <SelectItem key={paper.id} value={paper.id.toString()}>
                                                        {paper.studentName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center h-11">
                                        {selectedPaperId && examPapers?.find((p: any) => p.id.toString() === selectedPaperId) && (
                                            <div className="inline-flex items-center px-4 py-2 bg-accent/50 text-accent-foreground rounded-full text-sm font-medium border border-accent">
                                                الفصل: <span className="mr-1">{examPapers.find((p: any) => p.id.toString() === selectedPaperId).className}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedPaperId ? (
                                    isLoadingStudent ? (
                                        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                    ) : studentReport ? (
                                        <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
                                            {/* Student Summary Bar */}
                                            <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 p-4 md:p-6 md:px-10 bg-card rounded-2xl md:rounded-[2rem] shadow-sm border overflow-visible" dir="rtl">
                                                <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full md:w-auto">
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">اسم الطالب:</span>
                                                        <span className="text-base md:text-xl font-black text-foreground">{examPapers?.find((p: any) => p.id.toString() === selectedPaperId)?.studentName}</span>
                                                    </div>
                                                    <div className="hidden md:block h-8 w-[1px] bg-border"></div>
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">فصل:</span>
                                                        <span className="text-base md:text-xl font-black text-foreground">{examPapers?.find((p: any) => p.id.toString() === selectedPaperId)?.className}</span>
                                                    </div>
                                                    <div className="hidden md:block h-8 w-[1px] bg-border"></div>
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">المادة:</span>
                                                        <span className="text-base md:text-xl font-black text-foreground">{exams?.find((e: any) => e.id.toString() === selectedExamId)?.subject}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">التاريخ:</span>
                                                        <span className="text-base md:text-xl font-black text-foreground">
                                                            {selectedExam?.createdAt
                                                                ? (() => {
                                                                    const d = new Date(selectedExam.createdAt);
                                                                    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
                                                                })()
                                                                : "-"
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-r border-border">
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">النتيجة:</span>
                                                        <span className="text-base md:text-xl font-black text-blue-600">
                                                            {studentReport.totalCorrect}/{examPapers?.find((p: any) => p.id.toString() === selectedPaperId)?.totalQuestions || studentReport.goalAnalysis.length} ({(studentReport.percentage ?? 0).toFixed(0)}%)
                                                        </span>
                                                    </div>
                                                    <div className="hidden md:block h-8 w-[1px] bg-border"></div>

                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <span className="text-sm md:text-lg font-bold text-muted-foreground whitespace-nowrap">الحالة:</span>
                                                        <span className={`text-base md:text-xl font-black
                                                            ${(studentReport.percentage ?? 0) >= 90
                                                                ? "text-emerald-600"
                                                                : (studentReport.percentage ?? 0) >= 80
                                                                    ? "text-green-500"
                                                                    : (studentReport.percentage ?? 0) >= 70
                                                                        ? "text-blue-500"
                                                                        : (studentReport.percentage ?? 0) >= 50
                                                                            ? "text-amber-500"
                                                                            : "text-rose-500"
                                                            }`}
                                                        >
                                                            {
                                                                (studentReport.percentage ?? 0) >= 90
                                                                    ? "امتياز"
                                                                    : (studentReport.percentage ?? 0) >= 80
                                                                        ? "جيد جدًا"
                                                                        : (studentReport.percentage ?? 0) >= 70
                                                                            ? "جيد"
                                                                            : (studentReport.percentage ?? 0) >= 50
                                                                                ? "مقبول"
                                                                                : "ضعيف - بحاجة لدعم"
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* General Performance Radar Card */}
                                            <div className="bg-card rounded-2xl p-6 shadow-sm border flex flex-col items-center">
                                                <div className="flex items-center justify-between w-full mb-6" dir="rtl">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-foreground">الأداء العام للطالب</h3>
                                                        <p className="text-xs font-medium text-muted-foreground mt-0.5">مقارنة بمتوسط الفصل عبر جميع المهارات</p>
                                                    </div>
                                                    {/* Custom Legend */}
                                                    <div className="flex items-center gap-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-3 bg-[#60a5fa] rounded-sm opacity-80"></div>
                                                            <span className="text-xs font-semibold text-muted-foreground">أداء الطالب</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-3 bg-[#f472b6] rounded-sm opacity-80"></div>
                                                            <span className="text-xs font-semibold text-muted-foreground">متوسط الفصل</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full h-[450px] flex items-center justify-center" ref={radarChartRef}>
                                                    <Radar
                                                        data={radarData}
                                                        options={{
                                                            maintainAspectRatio: false,
                                                            scales: {
                                                                r: {
                                                                    min: 0,
                                                                    max: 100,
                                                                    ticks: {
                                                                        stepSize: 20,
                                                                        display: true,
                                                                        font: { size: 10 },
                                                                        color: '#94a3b8',
                                                                        backdropColor: 'transparent',
                                                                        z: 1
                                                                    },
                                                                    grid: { color: "#e2e8f0" },
                                                                    angleLines: { color: "#e2e8f0" },
                                                                    pointLabels: {
                                                                        font: { size: 12, family: 'Cairo', weight: 'bold' },
                                                                        color: '#64748b',
                                                                        callback: function (label: string) {
                                                                            // Wrap long labels into multiple lines
                                                                            const words = label.split(' ');
                                                                            const lines = [];
                                                                            let currentLine = '';

                                                                            for (let i = 0; i < words.length; i++) {
                                                                                if (currentLine.length + words[i].length > 25) {
                                                                                    lines.push(currentLine);
                                                                                    currentLine = words[i] + ' ';
                                                                                } else {
                                                                                    currentLine += words[i] + ' ';
                                                                                }
                                                                            }
                                                                            lines.push(currentLine.trim());
                                                                            return lines;
                                                                        }
                                                                    }
                                                                }
                                                            },
                                                            plugins: { legend: { display: false } }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Strengths Card */}
                                                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                                                    {/* Card Header */}
                                                    <div className="flex items-center gap-3 p-5 border-b bg-teal-500/10" dir="rtl">
                                                        <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                                                        <h4 className="text-base font-bold text-foreground">المهارات المتقنة (نقاط القوة)</h4>
                                                        <span className="mr-auto text-xs font-bold bg-teal-500/10 text-teal-600 px-2.5 py-1 rounded-full">
                                                            {studentReport.goalAnalysis.filter((g: any) => (g.successRate ?? 0) >= 50).length} مهارة
                                                        </span>
                                                    </div>

                                                    {/* Skill Rows */}
                                                    <div className="flex flex-col divide-y divide-slate-50 px-5 pt-3 pb-4" dir="rtl">
                                                        {studentReport.goalAnalysis
                                                            .filter((g: any) => g.successRate >= 50)
                                                            .sort((a: any, b: any) => b.successRate - a.successRate)
                                                            .map((g: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-4 py-3">
                                                                    <div className="flex flex-col flex-1 gap-0.5">
                                                                        <span className="text-sm font-bold text-slate-800 text-right">{g.goalText}</span>
                                                                        <span className="text-[11px] text-slate-400 font-medium text-right">تحليل الهدف: إتقان ممتاز للمفهوم المرتبط</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-teal-400 rounded-full"
                                                                                style={{ width: `${g.successRate ?? 0}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-teal-600 w-10 text-left">{(g.successRate ?? 0).toFixed(0)}%</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        {studentReport.goalAnalysis.filter((g: any) => (g.successRate ?? 0) >= 50).length === 0 && (
                                                            <p className="text-sm text-slate-400 italic py-4 text-center">لا توجد نقاط قوة مسجلة حتى الآن</p>
                                                        )}
                                                    </div>

                                                    <div className="mt-auto h-[320px] w-full flex items-center justify-center p-4 border-t border-slate-50" ref={strengthRadarChartRef}>
                                                        <Radar
                                                            data={strengthRadarData}
                                                            options={{
                                                                maintainAspectRatio: false,
                                                                scales: {
                                                                    r: {
                                                                        min: 0,
                                                                        max: 100,
                                                                        ticks: { display: false },
                                                                        grid: { color: "rgba(148,163,184,0.3)" },
                                                                        pointLabels: {
                                                                            display: true,
                                                                            font: { size: 10, family: 'Cairo', weight: 'bold' },
                                                                            color: '#334155',
                                                                            callback: function (label: string) {
                                                                                const words = label.split(' ');
                                                                                const lines = [];
                                                                                let currentLine = '';
                                                                                for (let i = 0; i < words.length; i++) {
                                                                                    if (currentLine.length + words[i].length > 20) {
                                                                                        lines.push(currentLine);
                                                                                        currentLine = words[i] + ' ';
                                                                                    } else {
                                                                                        currentLine += words[i] + ' ';
                                                                                    }
                                                                                }
                                                                                lines.push(currentLine.trim());
                                                                                return lines;
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                plugins: { legend: { display: false } }
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Weaknesses Card */}
                                                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                                                    {/* Card Header */}
                                                    <div className="flex items-center gap-3 p-5 border-b bg-rose-500/10" dir="rtl">
                                                        <div className="w-1 h-6 bg-rose-500 rounded-full"></div>
                                                        <h4 className="text-base font-bold text-foreground">المهارات المتعثرة (نقاط الضعف)</h4>
                                                        <span className="mr-auto text-xs font-bold bg-rose-500/10 text-rose-600 px-2.5 py-1 rounded-full">
                                                            {studentReport.goalAnalysis.filter((g: any) => g.successRate < 50).length} مهارة
                                                        </span>
                                                    </div>

                                                    {/* Skill Rows */}
                                                    <div className="flex flex-col divide-y px-5 pt-3 pb-4" dir="rtl">
                                                        {studentReport.goalAnalysis
                                                            .filter((g: any) => g.successRate < 50)
                                                            .sort((a: any, b: any) => a.successRate - b.successRate)
                                                            .map((g: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-4 py-3">
                                                                    {/* Skill Info */}
                                                                    <div className="flex flex-col flex-1 gap-0.5">
                                                                        <span className="text-sm font-bold text-foreground text-right">{g.goalText}</span>
                                                                        <span className="text-[11px] font-medium text-rose-400/90 text-right leading-tight mt-0.5">
                                                                            تحليل الهدف: {
                                                                                g.successRate === 0 ? "يوجد قصور شديد في فهم هذا الهدف، يتطلب تدريس المفهوم من الصفر." :
                                                                                    g.successRate < 25 ? "الفهم مشتت وغير دقيق، يحتاج لتدريبات مبسطة ومكثفة لتثبيت الأساسيات." :
                                                                                        "يواجه صعوبة في التطبيق لكنه يمتلك بعض الفهم، ننصح بالمراجعة وحل المزيد من التمارين."
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    {/* Progress */}
                                                                    <div className="flex items-center gap-2 shrink-0 min-w-[100px]">
                                                                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-rose-400 rounded-full"
                                                                                style={{ width: `${g.successRate}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-rose-600 w-9 text-left">{g.successRate.toFixed(0)}%</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        {studentReport.goalAnalysis.filter((g: any) => g.successRate < 50).length === 0 && (
                                                            <p className="text-sm text-muted-foreground italic py-4 text-center">عمل رائع! لا توجد مهارات متعثرة تستدعي التدخل حالياً</p>
                                                        )}
                                                    </div>

                                                    <div className="mt-auto h-[320px] w-full flex items-center justify-center p-4 border-t border-slate-50" ref={weaknessRadarChartRef}>
                                                        <Radar
                                                            data={weaknessRadarData}
                                                            options={{
                                                                maintainAspectRatio: false,
                                                                scales: {
                                                                    r: {
                                                                        min: 0,
                                                                        max: 100,
                                                                        ticks: { display: false },
                                                                        grid: { color: "rgba(148,163,184,0.6)" },
                                                                        pointLabels: {
                                                                            display: true,
                                                                            font: { size: 10, family: 'Cairo', weight: 'bold' },
                                                                            color: '#334155',
                                                                            callback: function (label: string) {
                                                                                const words = label.split(' ');
                                                                                const lines = [];
                                                                                let currentLine = '';
                                                                                for (let i = 0; i < words.length; i++) {
                                                                                    if (currentLine.length + words[i].length > 20) {
                                                                                        lines.push(currentLine);
                                                                                        currentLine = words[i] + ' ';
                                                                                    } else {
                                                                                        currentLine += words[i] + ' ';
                                                                                    }
                                                                                }
                                                                                lines.push(currentLine.trim());
                                                                                return lines;
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                plugins: { legend: { display: false } }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>


                                            {/* AI Recommendations Section */}
                                            {studentReport.goalAnalysis && studentReport.goalAnalysis.length > 0 && (
                                                <div className="bg-card rounded-2xl p-6 shadow-sm border mt-2 mb-4 no-print relative overflow-hidden">
                                                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-primary/5 rounded-full opacity-50 blur-2xl"></div>
                                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full opacity-50 blur-2xl"></div>

                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-3 mb-5" dir="rtl">
                                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                                <Lightbulb className="w-5 h-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-foreground">نصائح مخصصة للطالب</h3>
                                                                <p className="text-xs font-medium text-muted-foreground mt-0.5">خطوات عملية لتحسين المستوى الأكاديمي بناءً على تحليل الإجابات</p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 border shadow-sm" dir="rtl">
                                                            <ul className="space-y-4">
                                                                {studentReport.goalAnalysis.filter((g: any) => g.successRate < 50).length > 0 ? (
                                                                    <>
                                                                        <li className="flex items-start gap-4">
                                                                            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                                                                            <p className="text-sm font-semibold text-foreground leading-relaxed">
                                                                                يجب التركيز الفوري على مراجعة الأهداف التالية لكونها نقاط الضعف الأساسية:
                                                                                <span className="text-rose-500 mx-1 block mt-2 p-2 bg-rose-500/10 rounded-md border border-rose-500/20">
                                                                                    {studentReport.goalAnalysis.filter((g: any) => g.successRate < 50).map((g: any) => `«${g.goalText}»`).join('، و ')}
                                                                                </span>
                                                                            </p>
                                                                        </li>
                                                                    </>
                                                                ) : (
                                                                    <li className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                                                            <TrendingUp className="w-4 h-4" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-base font-bold text-foreground">أداء استثنائي ومتقن!</p>
                                                                            <p className="text-sm font-medium text-muted-foreground mt-1 leading-relaxed">
                                                                                الطالب أظهر إتقاناً لجميع الأهداف (لا توجد أهداف بنسبة نجاح أقل من النصف). يُنصح بالحفاظ على هذا المستوى الرائع، والبدء في حل مسائل أكثر تحدياً للوصول لأقصى مستويات التفوق.
                                                                            </p>
                                                                        </div>
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Detailed Answers Summary & Grid */}
                                            {studentReport.answers && studentReport.answers.length > 0 && (
                                                <div className="bg-card rounded-2xl p-6 shadow-sm border mt-2 no-print">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6" dir="rtl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                                            <h3 className="text-xl font-bold text-foreground">تفاصيل الإجابات</h3>
                                                        </div>
                                                        <div className="flex gap-4 p-2.5 bg-muted rounded-xl border">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                                                                    {studentReport.answers.filter((a: any) => a.ok).length}
                                                                </div>
                                                                <span className="text-sm font-semibold text-muted-foreground">إجابة صحيحة</span>
                                                            </div>
                                                            <div className="w-px h-8 bg-border"></div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                                                                    {studentReport.answers.filter((a: any) => !a.ok).length}
                                                                </div>
                                                                <span className="text-sm font-semibold text-muted-foreground">إجابة خاطئة</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pb-2 rounded-xl border">
                                                        <table className="w-full text-right border-collapse bg-card">
                                                            <thead className="bg-muted border-b">
                                                                <tr>
                                                                    <th className="px-5 py-4 text-sm font-bold text-muted-foreground text-center">التقييم</th>
                                                                    <th className="px-5 py-4 text-sm font-bold text-muted-foreground border-l text-center">الإجابة الصحيحة</th>
                                                                    <th className="px-5 py-4 text-sm font-bold text-muted-foreground border-l text-center">إجابة الطالب</th>
                                                                    <th className="px-5 py-4 text-sm font-bold text-muted-foreground border-l text-center"> السؤال</th>

                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y">
                                                                {studentReport.answers.map((answer: any, index: number) => {
                                                                    const displayType = answer.type?.toLowerCase() === 'mcq' ? 'اختيار' :
                                                                        answer.type?.toLowerCase() === 'true_false' ? 'صح/خطأ' :
                                                                            answer.type?.toLowerCase() === 'essay' ? 'مقالي' :
                                                                                answer.type?.toLowerCase() === 'complete' ? 'أكمل' : answer.type;

                                                                    const formatAnswer = (ans: string) => {
                                                                        if (!ans) return '-';
                                                                        const upperAns = ans.toString().toUpperCase();
                                                                        if (upperAns === 'TRUE') return 'صح';
                                                                        if (upperAns === 'FALSE') return 'خطأ';
                                                                        return ans;
                                                                    };

                                                                    const questionNum = answer.id || (index + 1);

                                                                    return (
                                                                        <tr key={questionNum} className="hover:bg-accent/50 transition-colors">
                                                                            <td className="px-5 py-4 text-center">
                                                                                <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold
                                                                                                    ${answer.ok
                                                                                        ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20'
                                                                                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}
                                                                                >
                                                                                    {answer.ok ? (
                                                                                        <><CheckSquare className="w-3.5 h-3.5" /> صحيحة</>
                                                                                    ) : (
                                                                                        <><AlertTriangle className="w-3.5 h-3.5" /> خاطئة</>
                                                                                    )}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-5 py-4 text-center border-l">
                                                                                <span className="text-base font-bold text-foreground">
                                                                                    {formatAnswer(answer.gt)}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-5 py-4 text-center border-l">
                                                                                <span className={`text-base font-bold ${answer.ok ? 'text-teal-600' : 'text-rose-500 line-through decoration-rose-300'}`}>
                                                                                    {formatAnswer(answer.pred)}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-6 py-4 text-center font-bold text-primary border-l">{questionNum} {displayType}</td>

                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/30">
                                        <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                        <h3 className="font-medium text-muted-foreground">يرجى اختيار طالب لعرض تقريره الفردي</h3>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Modal for Students Needing Intervention */}
                <Dialog open={isInterventionModalOpen} onOpenChange={setIsInterventionModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto sm:rounded-2xl border-none p-0 bg-transparent shadow-none" showCloseButton={false}>
                        <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden flex flex-col border-b-4 border-b-rose-600 w-full" dir="rtl">
                            <div className="flex items-center justify-between p-5 border-b bg-rose-600/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 bg-rose-600 rounded-full"></div>
                                    <h4 className="text-lg font-bold text-foreground">الطلاب المحتاجون للتدخل (أقل من 50%)</h4>
                                    <span className="text-xs font-bold bg-rose-600/10 text-rose-600 px-2.5 py-1 rounded-full mr-2">
                                        {classReport?.studentsNeedingIntervention?.length || 0} طلاب
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsInterventionModalOpen(false)} className="rounded-full hover:bg-rose-100 text-rose-600">
                                    <XIcon className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="p-6">
                                {classReport?.studentsNeedingIntervention && classReport.studentsNeedingIntervention.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {classReport.studentsNeedingIntervention.map((student: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100 group hover:border-rose-300 transition-colors">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-base font-bold text-foreground">{student.studentName}</span>
                                                    <span className="text-xs text-muted-foreground">{student.className}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-lg font-black text-rose-600">{(student.percentage ?? 0).toFixed(1)}%</span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all rounded-lg px-4"
                                                        onClick={() => {
                                                            const paper = examPapers?.find((p: any) => p.studentId === student.studentId);
                                                            if (paper) {
                                                                setSelectedPaperId(paper.id.toString());
                                                                setActiveTab("students");
                                                                setIsInterventionModalOpen(false);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }
                                                        }}
                                                    >
                                                        عرض التقرير المفصل
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                            <CheckSquare className="h-8 w-8 text-emerald-600" />
                                        </div>
                                        <p className="text-lg text-muted-foreground font-medium">لا يوجد طلاب بحاجة لتدخل عاجل في هذا النطاق.</p>
                                        <p className="text-sm text-muted-foreground mt-1">جميع الطلاب حققوا نسبة أعلى من 50%</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-muted/30 border-t flex justify-end">
                                <Button onClick={() => setIsInterventionModalOpen(false)} className="rounded-xl px-8">إغلاق</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <HelpFab
                title="كيفية استخدام تحليل النتائج"
                description="توفر لك هذه الصفحة إحصائيات متقدمة ورسوم بيانية لأداء الفصول والطلاب."
                tooltip="دليل استخدام التحليل"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground font-bold">كيف تقرأ الرسوم البيانية؟</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
                        <li><strong>التقرير الشامل:</strong> يعرض نظرة عامة على أداء الفصل، نقاط القوة والضعف، والخطة العلاجية المقترحة.</li>
                        <li><strong>تقرير تفصيلي للأسئلة:</strong> يحلل أداء الطلاب في كل سؤال على حدة مع تحديد الأهداف المرتبطة ونسب النجاح لكل سؤال.</li>
                        <li><strong>التقارير الفردية:</strong> تتيح لك مراجعة أداء كل طالب بشكل منفصل مع رسم بياني يقارن أداءه بمتوسط الفصل.</li>
                    </ul>
                    <p className="text-sm border-t pt-2 mt-4 text-primary font-bold">يمكنك طباعة أو تحميل أي تقرير بتنسيق PDF من الأزرار العلوية.</p>
                </div>
            </HelpFab>
        </MainLayout>
    );
}

function XIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
