import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ClassReportTab } from "./analysis/components/ClassReportTab";
import { DetailedAnalysisTab } from "./analysis/components/DetailedAnalysisTab";
import { StudentReportTab } from "./analysis/components/StudentReportTab";
import { useGetExams } from "../hooks/use-exams";
import { useGetExamPapers, useGetClassReport, useGetStudentReport } from "../hooks/use-analysis";
import { calculateStats, getHijriYearOnly, getSemesterName } from "./analysis/utils";

export default function PrintAnalysis() {
    const { examId, tab } = useParams<{ examId: string; tab: string }>();
    const [searchParams] = useSearchParams();
    const classIdFromUrl = searchParams.get("classId");
    const paperIdFromUrl = searchParams.get("paperId");
    
    // We only need local state for student selection if tab is 'students' so we can flip through them,
    // although for print we just print whatever they had selected before opening the tab.
    const [selectedPaperId, setSelectedPaperId] = useState<string>(paperIdFromUrl || "");

    const selectedExamId = examId || "";
    const selectedClassId = classIdFromUrl === "all" || classIdFromUrl === null ? undefined : classIdFromUrl;

    const { data: exams, isLoading: isLoadingExams } = useGetExams();
    const { data: examPapers, isLoading: isLoadingPapers } = useGetExamPapers(selectedExamId ? parseInt(selectedExamId) : null);

    const classIdValue = selectedClassId 
        ? examPapers?.find((p: any) => p.className === selectedClassId)?.classId
        : undefined;

    const { data: classReport, isLoading: isLoadingClass } = useGetClassReport(
        selectedExamId ? parseInt(selectedExamId) : null,
        classIdValue
    );

    const { data: studentReport, isLoading: isLoadingStudent } = useGetStudentReport(
        selectedPaperId ? parseInt(selectedPaperId) : null
    );

    // Refs for charts (though not used directly for PDF since we are using window.print)
    const barChartRef = useRef<any>(null);
    const radarChartRef = useRef<any>(null);
    const strengthRadarChartRef = useRef<any>(null);
    const weaknessRadarChartRef = useRef<any>(null);
    const classQuestionBarChartRef = useRef<any>(null);

    // uniqueClasses removed because not used in print report dropdowns

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

    // Doughnut removed

    const selectedExam = exams?.find((e: any) => e.id.toString() === selectedExamId);
    const displayClassName = selectedClassId === "all" || !selectedClassId ? "جميع الفصول" : selectedClassId;

    const isLoadingBaseData = isLoadingExams || isLoadingPapers;
    const isLoadingCurrentTab = 
        tab === "class" ? isLoadingClass :
        tab === "detailed" ? isLoadingClass :
        tab === "students" ? isLoadingStudent : false;
        
    const isReady = !isLoadingBaseData && !isLoadingCurrentTab && selectedExam;

    // Auto-print effect
    useEffect(() => {
        if (isReady) {
            // Give charts some time to finish drawing animations before calling print
            const timer = setTimeout(() => {
                window.print();
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [isReady]);

    if (!selectedExamId) {
        return (
            <div className="flex justify-center py-20 font-bold" dir="rtl">
                لا يوجد اختبار محدد للطباعة.
            </div>
        );
    }

    if (!isReady) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50" dir="rtl">
                <Loader2 className="h-16 w-16 animate-spin text-emerald-500 mb-6" />
                <h2 className="text-2xl font-black text-slate-800">جاري تجهيز تقرير الطباعة...</h2>
                <p className="text-slate-500 font-bold mt-2">يرجى الانتظار، سيتم فتح نافذة الطباعة تلقائياً.</p>
            </div>
        );
    }

    return (
        <div id="analysis-report-content" className="w-full bg-white text-black p-0 m-0 print-exact" dir="rtl">
            {/* Header / Info Bar (Unified style from Analysis.tsx) */}
            <div className="w-full mb-6">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">تقرير التحليل الأكاديمي</h1>
                    <h2 className="text-xl font-bold text-slate-500 mt-1">{selectedExam?.title}</h2>
                </div>
                
                <div className="border-2 border-slate-200 rounded-2xl overflow-hidden w-full">
                    <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-200 text-center">
                        <div className="p-3 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">الفصل</span>
                            <span className="text-sm font-black text-slate-800">{displayClassName}</span>
                        </div>
                        <div className="p-3 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">الاختبار</span>
                            <span className="text-sm font-black text-slate-800">{getSemesterName(selectedExam?.createdAt)}</span>
                        </div>
                        <div className="p-3 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">السنة الدراسية</span>
                            <span className="text-sm font-black text-slate-800">{getHijriYearOnly(selectedExam?.createdAt)}</span>
                        </div>
                        <div className="p-3 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">المادة الدراسية</span>
                            <span className="text-sm font-black text-slate-800">{selectedExam?.subject}</span>
                        </div>
                        <div className="p-3 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">الدرجة العظمى</span>
                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full self-center">{stats.maxScore} درجة</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Switch based on Tab */}
            <div className="report-content">
                {tab === "class" && classReport && (
                    <ClassReportTab
                        classReport={classReport}
                        stats={stats}
                        displayClassName={displayClassName}
                        selectedExam={selectedExam}
                        classPerformanceData={classPerformanceData}
                        setIsInterventionModalOpen={() => {}}
                        barChartRef={barChartRef}
                        examPapers={examPapers}
                        selectedClassId={selectedClassId}
                    />
                )}

                {tab === "detailed" && classReport && (
                    <DetailedAnalysisTab
                        classReport={classReport}
                        selectedExam={selectedExam}
                        displayClassName={displayClassName}
                        classQuestionBarChartRef={classQuestionBarChartRef}
                    />
                )}

                {tab === "students" && studentReport && (
                    <StudentReportTab
                        selectedExam={selectedExam}
                        examPapers={examPapers}
                        selectedPaperId={selectedPaperId}
                        setSelectedPaperId={setSelectedPaperId}
                        selectedClassId={selectedClassId}
                        isLoadingStudent={isLoadingStudent}
                        studentReport={studentReport}
                        radarData={radarData}
                        radarChartRef={radarChartRef}
                        strengthRadarChartRef={strengthRadarChartRef}
                        weaknessRadarChartRef={weaknessRadarChartRef}
                    />
                )}
            </div>
            
            {/* Some minimal CSS scoped to the print layout */}
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 8mm;
                    }
                    body {
                        zoom: 0.95 !important;
                        background: white !important;
                    }
                    /* Ensure all inputs and buttons are completely hidden in print route, no tabs! */
                    button, .lucide-chevron-down {
                        display: none !important;
                    }
                }
                body {
                    background-color: white !important;
                }
            `}</style>
        </div>
    );
}
