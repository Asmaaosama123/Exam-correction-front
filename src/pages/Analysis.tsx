import { Loader2, BarChart3, FileText, Users } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { AnalysisHeader } from "./analysis/components/AnalysisHeader";
import { ClassReportTab } from "./analysis/components/ClassReportTab";
import { DetailedAnalysisTab } from "./analysis/components/DetailedAnalysisTab";
import { StudentReportTab } from "./analysis/components/StudentReportTab";
import { useGetExams } from "../hooks/use-exams";
import { useGetExamPapers, useGetClassReport, useGetStudentReport } from "../hooks/use-analysis";
import { calculateStats, getHijriYearOnly, getSemesterName } from "./analysis/utils";
import { useAnalysisPdf } from "./analysis/use-analysis-pdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SummaryPrintTemplate } from "./analysis/components/SummaryPrintTemplate";
import { StudentPrintTemplate } from "./analysis/components/StudentPrintTemplate";

export default function Analysis() {
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
    const [selectedPaperId, setSelectedPaperId] = useState<string>("");
    const [activeTab, setActiveTab] = useState("class");
    const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);

    const { data: exams, isLoading: isLoadingExams } = useGetExams();
    const { data: examPapers } = useGetExamPapers(selectedExamId ? parseInt(selectedExamId) : null);

    const classIdValue = selectedClassId && selectedClassId !== "all"
        ? examPapers?.find((p: any) => p.className === selectedClassId)?.classId
        : undefined;

    const { data: classReport, isLoading: isLoadingClass } = useGetClassReport(
        selectedExamId ? parseInt(selectedExamId) : null,
        classIdValue
    );

    const { data: studentReport, isLoading: isLoadingStudent } = useGetStudentReport(
        selectedPaperId ? parseInt(selectedPaperId) : null
    );

    const { isDownloadingPDF, handleDownloadPDF, refs } = useAnalysisPdf();
    
    const handlePrint = () => {
        window.print();
    };

    const uniqueClasses = useMemo(() => {
        if (!examPapers) return [];
        return Array.from(new Set(examPapers.map((p: any) => p.className)));
    }, [examPapers]);

    const stats = useMemo(() => calculateStats(examPapers, selectedClassId), [examPapers, selectedClassId]);

    const classPerformanceData = useMemo(() => {
        if (!classReport) return { labels: [], datasets: [] };
        return {
            labels: classReport.goalAnalysis.map((g: any) => g.goalText),
            datasets: [{
                label: 'نسبة النجاح %',
                data: classReport.goalAnalysis.map((g: any) => g.successRate),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            }]
        };
    }, [classReport]);

    const radarData = useMemo(() => {
        if (!studentReport) return { labels: [], datasets: [] };

        const classAverages = studentReport.goalAnalysis.map((g: any) => {
            const classGoal = classReport?.goalAnalysis.find((cg: any) => cg.goalText === g.goalText);
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
                    fill: true,
                    order: 2
                },
                {
                    label: "أداء الطالب",
                    data: studentReport.goalAnalysis.map((g: any) => g.successRate),
                    backgroundColor: "rgba(96, 165, 250, 0.45)",
                    borderColor: "#60a5fa",
                    fill: true,
                    order: 1
                }
            ]
        };
    }, [studentReport, classReport]);

    const doughnutData = useMemo(() => {
        if (!classReport) return { labels: [], datasets: [] };
        return {
            labels: ['إتقان واجتياز (فوق 50%)', 'تعثر ويحتاج تدخل (أقل من 50%)'],
            datasets: [{
                data: [stats.count - stats.criticalCount, stats.criticalCount],
                backgroundColor: ['rgba(16, 185, 129, 0.9)', 'rgba(244, 63, 94, 0.9)'],
                borderColor: ['rgb(16, 185, 129)', 'rgb(244, 63, 94)'],
                borderWidth: 1,
                hoverOffset: 15
            }]
        };
    }, [classReport, stats]);

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { position: 'bottom' as const } }
    };

    const selectedExam = exams?.find((e: any) => e.id.toString() === selectedExamId);
    const displayClassName = selectedClassId === "all" || !selectedClassId ? "جميع الفصول" : selectedClassId;

    return (
        <MainLayout>
            <div id="analysis-report-content" className={`p-4 md:p-8 space-y-8 w-full mx-auto pb-20 overflow-hidden ${activeTab === 'class' ? 'print:hidden' : 'print:p-0 print:m-0 print:w-full print:max-w-none print:overflow-visible print:block'}`} dir="rtl">

                <AnalysisHeader
                    selectedExamId={selectedExamId}
                    setSelectedExamId={setSelectedExamId}
                    setSelectedClassId={setSelectedClassId}
                    isLoadingExams={isLoadingExams}
                    exams={exams}
                    handlePrint={handlePrint as () => void}
                    handleDownloadPDF={() => handleDownloadPDF({
                        selectedExamId,
                        selectedPaperId,
                        selectedClassId,
                        classIdValue,
                        activeTab,
                        selectedExam
                    })}
                    isDownloadingPDF={isDownloadingPDF}
                    stats={stats}
                    selectedExam={selectedExam}
                    displayClassName={displayClassName}
                />

                {selectedExamId ? (
                    <div className="space-y-8 print:space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-start print:hidden">
                            <div className="bg-white rounded-2xl border-2 border-slate-100 px-4 py-1.5 flex items-center gap-3 shadow-sm hover:border-emerald-500/30 transition-all min-w-[220px]">
                                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                    <SelectTrigger className="h-10 border-none shadow-none bg-transparent focus:ring-0 px-1 text-sm font-black text-slate-700">
                                        <SelectValue placeholder="اختيار الفصل" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                        <SelectItem value="all" className="rounded-xl font-bold">جميع الفصول</SelectItem>
                                        {uniqueClasses.map((className) => (
                                            <SelectItem key={className} value={className} className="rounded-xl font-bold">
                                                {className}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Users className="h-5 w-5 text-emerald-500" />
                            </div>
                        </div>

                        {/* Unified Info Bar - Consolidated */}
                        <div className={`bg-white/80 backdrop-blur-sm rounded-[2.5rem] print:rounded-lg border border-slate-100 shadow-sm overflow-hidden w-full print:!w-full print:!max-w-none print:shadow-none print:border print:border-slate-300 print:mb-4 ${activeTab === 'students' ? 'print:hidden' : ''}`} dir="rtl">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 print:grid-cols-5 divide-y md:divide-y-0 print:divide-y-0 md:divide-x md:divide-x-reverse print:divide-x print:divide-x-reverse divide-slate-100 text-center">
                                <div className="p-5 print:p-3 flex flex-col gap-1 print:gap-0 justify-center">
                                    <span className="text-[10px] print:text-[9px] font-black text-slate-400 uppercase tracking-widest">الفصل</span>
                                    <span className="text-sm border-0 font-black text-slate-800 print:text-xs">{displayClassName}</span>
                                </div>
                                <div className="p-5 print:p-3 flex flex-col gap-1 print:gap-0 justify-center">
                                    <span className="text-[10px] print:text-[9px] font-black text-slate-400 uppercase tracking-widest">الاختبار</span>
                                    <span className="text-sm border-0 font-black text-slate-800 print:text-xs">{getSemesterName(selectedExam?.createdAt)}</span>
                                </div>
                                <div className="p-5 print:p-3 flex flex-col gap-1 print:gap-0 justify-center">
                                    <span className="text-[10px] print:text-[9px] font-black text-slate-400 uppercase tracking-widest">السنة والتقويم</span>
                                    <span className="text-sm border-0 font-black text-slate-800 print:text-xs">{getHijriYearOnly(selectedExam?.createdAt)}</span>
                                </div>
                                <div className="p-5 print:p-3 flex flex-col gap-1 print:gap-0 justify-center">
                                    <span className="text-[10px] print:text-[9px] font-black text-slate-400 uppercase tracking-widest">المادة الدراسية</span>
                                    <span className="text-sm border-0 font-black text-slate-800 print:text-xs">{selectedExam?.subject}</span>
                                </div>
                                <div className="p-5 print:p-3 flex flex-col gap-1 print:gap-0 justify-center">
                                    <span className="text-[10px] print:text-[9px] font-black text-slate-400 uppercase tracking-widest">الدرجة العظمى</span>
                                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 print:bg-transparent print:border print:border-emerald-200 px-3 py-0.5 rounded-full self-center print:text-xs">{stats.maxScore} درجة</span>
                                </div>
                            </div>
                        </div>

                        {isLoadingClass ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
                                <p className="text-slate-400 font-bold text-lg">جاري تحميل بيانات التحليل ...</p>
                            </div>
                        ) : classReport ? (
                            <Tabs defaultValue="class" className="space-y-8" onValueChange={setActiveTab}>
                                {/* Tabs Centered */}
                                <div className="flex justify-center py-2 print:hidden">
                                    <TabsList className="bg-slate-100/50 p-1.5 rounded-full gap-2 h-auto" dir="rtl">
                                        <TabsTrigger
                                            value="class"
                                            className="px-8 py-3 font-bold text-sm rounded-full bg-transparent text-slate-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-200 transition-all duration-300 flex items-center gap-2.5"
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                            التقرير الشامل للفصل
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="detailed"
                                            className="px-8 py-3 font-bold text-sm rounded-full bg-transparent text-slate-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-200 transition-all duration-300 flex items-center gap-2.5"
                                        >
                                            <FileText className="w-4 h-4" />
                                            تحليل تفصيلي للأسئلة
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="students"
                                            className="px-8 py-3 font-bold text-sm rounded-full bg-transparent text-slate-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-200 transition-all duration-300 flex items-center gap-2.5"
                                        >
                                            <Users className="w-4 h-4" />
                                            التقارير الفردية
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="animate-in fade-in duration-700 print:w-full print:block">
                                    <TabsContent value="class" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                                        <ClassReportTab
                                            classReport={classReport}
                                            stats={stats}
                                            displayClassName={displayClassName}
                                            selectedExam={selectedExam}
                                            classPerformanceData={classPerformanceData}
                                            doughnutData={doughnutData}
                                            doughnutOptions={doughnutOptions}
                                            setIsInterventionModalOpen={setIsInterventionModalOpen}
                                            barChartRef={refs.barChartRef}
                                            examPapers={examPapers}
                                            selectedClassId={selectedClassId}
                                        />
                                    </TabsContent>

                                    <TabsContent value="detailed" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                                        <DetailedAnalysisTab
                                            classReport={classReport}
                                            selectedExam={selectedExam}
                                            displayClassName={displayClassName}
                                            classQuestionBarChartRef={refs.classQuestionBarChartRef}
                                        />
                                    </TabsContent>

                                    <TabsContent value="students" className="mt-6 focus-visible:outline-none focus-visible:ring-0 print:!w-[100vw] print:!m-0 print:!p-0 print:mt-0 print:absolute print:top-0 print:right-0 print:z-[99999] print:bg-white" dir="rtl">
                                        <StudentReportTab
                                            selectedExam={selectedExam}
                                            examPapers={examPapers}
                                            selectedPaperId={selectedPaperId}
                                            setSelectedPaperId={setSelectedPaperId}
                                            selectedClassId={selectedClassId}
                                            isLoadingStudent={isLoadingStudent}
                                            studentReport={studentReport}
                                            radarData={radarData}
                                            radarChartRef={refs.radarChartRef}
                                            strengthRadarChartRef={refs.strengthRadarChartRef}
                                            weaknessRadarChartRef={refs.weaknessRadarChartRef}
                                        />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        ) : (
                            <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-100">لا توجد بيانات متاحة حالياً</div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in duration-700">
                        <div className="bg-white/50 backdrop-blur-sm p-10 rounded-full shadow-sm mb-8 border border-slate-100">
                            <span className="text-7xl">📊</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-800 mb-4">لا يوجد اختبار محدد</h3>
                        <p className="text-slate-400 font-bold max-w-lg text-xl leading-relaxed">
                            الرجاء اختيار اختبار من القائمة العلوية لعرض التحليلات الذكية الشاملة المتعلقة به
                        </p>
                    </div>
                )}
            </div>

            {/* Intervention List Modal */}
            <Dialog open={isInterventionModalOpen} onOpenChange={setIsInterventionModalOpen}>
                <DialogContent className="sm:max-w-md flex flex-col md:block items-center rounded-[2rem] border-slate-100 shadow-2xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 font-black text-xl">
                            <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></span>
                            طلاب التدخل والمتابعة
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-6 max-h-[60vh] overflow-y-auto small-scroll pr-1">
                        {examPapers && examPapers.filter((p: any) => (!selectedClassId || selectedClassId === "all" || p.className === selectedClassId) && p.finalScore !== undefined && p.finalScore !== null && p.totalQuestions > 0 && (p.finalScore / p.totalQuestions) < 0.5).length > 0 ? (
                            <ul className="space-y-4 pt-2">
                                {examPapers.filter((p: any) => (!selectedClassId || selectedClassId === "all" || p.className === selectedClassId) && p.finalScore !== undefined && p.finalScore !== null && p.totalQuestions > 0 && (p.finalScore / p.totalQuestions) < 0.5)
                                    .sort((a: any, b: any) => (a.finalScore || 0) - (b.finalScore || 0))
                                    .map((paper: any, idx: number) => (
                                        <li key={idx} className="flex justify-between items-center bg-rose-50/20 p-4 rounded-2xl border border-rose-100 hover:bg-rose-50 transition-colors">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-black text-slate-800 text-base">{paper.studentName}</span>
                                                <span className="text-xs text-rose-600 font-black bg-white px-3 py-1 rounded-full border border-rose-100 self-start shadow-sm">فصل: {paper.className}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-black text-rose-600">{(paper.finalScore || 0).toFixed(1)} / {paper.totalQuestions}</span>
                                                    <span className="text-xs text-slate-400 font-bold">بنسبة {(((paper.finalScore || 0) / paper.totalQuestions) * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-slate-400 font-bold">لا يوجد طلاب بحاجة لتدخل في هذا الاختيار</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {activeTab === 'class' && (
                <div className="absolute top-0 left-0 w-full opacity-0 pointer-events-none -z-50 print:opacity-100 print:pointer-events-auto print:relative print:z-[99999] print:bg-white" dir="rtl" aria-hidden="true">
                    <SummaryPrintTemplate
                        classReport={classReport}
                        stats={stats}
                        displayClassName={displayClassName}
                        selectedExam={selectedExam}
                        classPerformanceData={classPerformanceData}
                        examPapers={examPapers}
                        selectedClassId={selectedClassId}
                    />
                </div>
            )}
        </MainLayout>
    );
}
