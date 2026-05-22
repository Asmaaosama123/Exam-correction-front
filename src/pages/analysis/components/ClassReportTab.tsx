import { TrendingUp, AlertCircle, FileText, CheckCircle2, AlertTriangle, Sparkles, Award, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar } from 'react-chartjs-2';
import { PremiumLevelProgressCard, PremiumMetricCard, GradeRangeHeatStrip } from "./MetricCards";
import type { ClassReport, Stats, Exam, ExamPaper } from "../types";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClassReportTabProps {
    classReport: ClassReport | undefined;
    stats: Stats;
    displayClassName: string;
    selectedExam: Exam | undefined;
    classPerformanceData: any;

    setIsInterventionModalOpen: (val: boolean) => void;
    barChartRef: React.RefObject<HTMLDivElement>;
    examPapers?: ExamPaper[];
    selectedClassId?: string;
}

export const ClassReportTab = ({
    classReport,
    stats,
    displayClassName,
    selectedExam,
    classPerformanceData,

    setIsInterventionModalOpen,
    barChartRef,
    examPapers,
    selectedClassId
}: ClassReportTabProps) => {
    const [selectedGradeForModal, setSelectedGradeForModal] = useState<string | null>(null);
    const [selectedMetricModal, setSelectedMetricModal] = useState<string | null>(null);

    const getGradeInfo = (grade: string) => {
        switch(grade) {
            case "ممتاز": return { min: 90, max: 100, color: "text-emerald-600", accent: "bg-emerald-500" };
            case "جيد جداً": return { min: 80, max: 89.9, color: "text-teal-600", accent: "bg-teal-500" };
            case "جيد": return { min: 70, max: 79.9, color: "text-blue-600", accent: "bg-blue-500" };
            case "مقبول": return { min: 50, max: 69.9, color: "text-amber-600", accent: "bg-amber-500" };
            case "ضعيف": return { min: 0, max: 49.9, color: "text-rose-600", accent: "bg-rose-500" };
            default: return { min: 0, max: 0, color: "text-slate-600", accent: "bg-slate-500" };
        }
    };

    const studentsForModal = examPapers?.filter((p: any) => {
        // First filter by class
        if (selectedClassId && selectedClassId !== "all" && p.className !== selectedClassId) return false;
        // Filter out students without scores
        if (p.finalScore === null || p.finalScore === undefined) return false;

        // If grade modal is active
        if (selectedGradeForModal) {
            const info = getGradeInfo(selectedGradeForModal);
            const percentage = (p.finalScore / (p.totalQuestions || 1)) * 100;
            return percentage >= info.min && percentage <= info.max;
        }

        // If metric modal is active
        if (selectedMetricModal === "max") return p.finalScore === stats.max;
        if (selectedMetricModal === "min") return p.finalScore === stats.min;
        if (selectedMetricModal === "avg") return Math.abs(p.finalScore - stats.avg) <= (stats.maxScore * 0.05); // within 5% of max score range

        return false;
    }) || [];

    return (
        <div className="space-y-6 print:space-y-2 w-full print:max-w-none print:w-full print:m-0 print:p-0" dir="rtl">

            {/* Premium Executive KPI Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:gap-2 mb-6 print:mb-2">
                <div className="premium-glass-card group p-5 print:p-2.5 bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-emerald-50/10 border border-emerald-100/60 rounded-3xl print:rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.12)] hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-center print:break-inside-avoid">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/0 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                            <div className="absolute inset-0 rounded-full shadow-sm" style={{background: `conic-gradient(#10b981 ${(classReport?.overallPercentage ?? 0)}%, #d1fae5 0)`}}></div>
                            <div className="absolute flex items-center justify-center bg-[#f7fcf9] rounded-full w-[62px] h-[62px] shadow-sm z-10">
                                <span className="text-xl font-black text-slate-800">
                                    {(classReport?.overallPercentage ?? 0).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[11px] font-black text-emerald-800 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200/50 shadow-sm flex items-center gap-1.5 w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    المتوسط العام للفصل
                                </span>
                                <div className="p-1.5 bg-emerald-500/10 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm hidden sm:block">
                                    <TrendingUp className="h-4 w-4 drop-shadow-sm" />
                                </div>
                            </div>
                            <span className="text-[11px] text-slate-500 font-bold mt-1 leading-relaxed">
                                متوسّط <span className="text-emerald-600 font-black text-sm">{stats.avg.toFixed(1)}</span> درجة من أصل {stats.maxScore}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="premium-glass-card group p-5 print:p-2.5 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-blue-50/10 border border-blue-100/60 rounded-3xl print:rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.12)] hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden print:break-inside-avoid">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/0 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-[11px] font-black text-blue-800 bg-blue-500/10 px-3.5 py-1 rounded-xl border border-blue-200/50 shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            نسبة العبور والاجتياز
                        </span>
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
                            <CheckCircle2 className="h-4 w-4 drop-shadow-sm" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 mt-3 print:mt-1 relative z-10">
                        <span className="text-4xl lg:text-5xl print:text-2xl print:lg:text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-[1.03] transition-transform duration-300 block">
                            {(100 - stats.levels.weak.percentage).toFixed(0)}
                        </span>
                        <span className="text-xl font-black text-blue-600">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2.5 relative z-10">
                        {(stats.count - stats.levels.weak.count)} طلاب من أصل {stats.count} اجتازوا بنجاح
                    </p>
                    <div className="w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-4 opacity-40 relative z-10" />
                </div>

                <div 
                    className="premium-glass-card group p-5 print:p-2.5 bg-gradient-to-br from-rose-50/60 via-pink-50/30 to-rose-50/10 border border-rose-100/60 rounded-3xl print:rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(244,63,94,0.15)] hover:border-rose-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer print:break-inside-avoid"
                    onClick={() => setIsInterventionModalOpen(true)}
                >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-rose-400/20 to-pink-400/0 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-[11px] font-black text-rose-800 bg-rose-500/10 px-3.5 py-1 rounded-xl border border-rose-200/50 shadow-sm flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            بحاجة لدعم ومساندة (أقل من 50%)
                        </span>
                        <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-sm">
                            <AlertTriangle className="h-4 w-4 drop-shadow-sm" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 mt-3 print:mt-1 relative z-10">
                        <span className="text-4xl lg:text-5xl print:text-2xl print:lg:text-2xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-[1.03] transition-transform duration-300 block">
                            {stats.criticalCount}
                        </span>
                        <span className="text-xl font-black text-rose-600">طلاب</span>
                    </div>
                    <p className="text-[10px] text-rose-500/80 font-black mt-2.5 relative z-10 flex items-center gap-1">
                        <span>عرض قائمة التدخل العاجل</span>
                        <span className="text-xs">←</span>
                    </p>
                    <div className="w-full h-1 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full mt-4 opacity-40 relative z-10" />
                </div>

                <div className="premium-glass-card group p-5 print:p-2.5 bg-gradient-to-br from-violet-50/60 via-purple-50/30 to-violet-50/10 border border-violet-100/60 rounded-3xl print:rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(139,92,246,0.12)] hover:border-violet-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden print:break-inside-avoid">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-purple-400/0 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-[11px] font-black text-violet-800 bg-violet-500/10 px-3.5 py-1 rounded-xl border border-violet-200/50 shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                            عدد الطلاب
                        </span>
                        <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-600 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300 shadow-sm">
                            <Users className="h-4 w-4 drop-shadow-sm" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 mt-3 print:mt-1 relative z-10">
                        <span className="text-4xl lg:text-5xl print:text-2xl print:lg:text-2xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-[1.03] transition-transform duration-300 block">
                            {stats.count}
                        </span>
                        <span className="text-xl font-black text-violet-600">طالب</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2.5 relative z-10">
                        العدد الإجمالي للطلاب المنضمين لعملية التحليل
                    </p>
                    <div className="w-full h-1 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full mt-4 opacity-40 relative z-10" />
                </div>
            </div>

            {/* Academic Diagnostic Console */}
            <div className="w-full space-y-8 print:space-y-4 mt-6 print:mt-2">
                <div className="text-right border-b border-slate-100 pb-4 print:pb-2">
                    <h3 className="text-xl md:text-2xl print:text-lg print:md:text-lg font-black text-slate-800 tracking-tight">
                        نتائج التحصيل العلمي الكلي
                    </h3>
                </div>

                <div className="space-y-8 print:space-y-4">
                    <div className="space-y-6 print:space-y-2">
                        <h4 className="text-sm font-black text-slate-700 text-right pr-4 border-r-4 border-emerald-500">
                            مصفوفة التقديرات وتوزيع أداء الطلاب
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 print:gap-2">
                            <PremiumLevelProgressCard
                                label="ممتاز"
                                percentage={stats.levels.excellent.percentage}
                                count={stats.levels.excellent.count}
                                scoreRange={`${((0.9 * stats.maxScore)).toFixed(1)} - ${(stats.maxScore).toFixed(1)}`}
                                gradientClass="from-emerald-400 to-emerald-600"
                                onClick={() => setSelectedGradeForModal("ممتاز")}
                            />
                            <PremiumLevelProgressCard
                                label="جيد جداً"
                                percentage={stats.levels.veryGood.percentage}
                                count={stats.levels.veryGood.count}
                                scoreRange={`${((0.8 * stats.maxScore)).toFixed(1)} - ${((0.899 * stats.maxScore)).toFixed(1)}`}
                                gradientClass="from-teal-400 to-teal-600"
                                onClick={() => setSelectedGradeForModal("جيد جداً")}
                            />
                            <PremiumLevelProgressCard
                                label="جيد"
                                percentage={stats.levels.good.percentage}
                                count={stats.levels.good.count}
                                scoreRange={`${((0.7 * stats.maxScore)).toFixed(1)} - ${((0.799 * stats.maxScore)).toFixed(1)}`}
                                gradientClass="from-blue-400 to-blue-600"
                                onClick={() => setSelectedGradeForModal("جيد")}
                            />
                            <PremiumLevelProgressCard
                                label="مقبول"
                                percentage={stats.levels.acceptable.percentage}
                                count={stats.levels.acceptable.count}
                                scoreRange={`${((0.5 * stats.maxScore)).toFixed(1)} - ${((0.699 * stats.maxScore)).toFixed(1)}`}
                                gradientClass="from-amber-500 to-amber-600"
                                onClick={() => setSelectedGradeForModal("مقبول")}
                            />
                            <PremiumLevelProgressCard
                                label="ضعيف"
                                percentage={stats.levels.weak.percentage}
                                count={stats.levels.weak.count}
                                scoreRange={`0 - ${((0.499 * stats.maxScore)).toFixed(1)}`}
                                gradientClass="from-rose-400 to-rose-600"
                                onClick={() => setSelectedGradeForModal("ضعيف")}
                            />
                        </div>
                    </div>

                    <div className="space-y-6 print:space-y-2 max-w-full">
                        <h4 className="text-sm font-black text-slate-700 text-right pr-4 border-r-4 border-indigo-500">
                            المقاييس الإحصائية القياسية المعتمدة
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-2 max-w-full print:w-full">
                            <PremiumMetricCard 
                                title="أعلى درجة مرصودة" 
                                value={stats.max} 
                                unit={`/ ${stats.maxScore}`} 
                                icon={<Award className="h-5 w-5" />} 
                                description="أفضل أداء طلابي تم تسجيله في الاختبار" 
                                onClick={() => setSelectedMetricModal("max")}
                            />
                            <PremiumMetricCard 
                                title="أقل درجة مرصودة" 
                                value={stats.min} 
                                unit={`/ ${stats.maxScore}`} 
                                icon={<AlertCircle className="h-5 w-5" />} 
                                description="أدنى علامة مسجلة في هذا التقييم" 
                                onClick={() => setSelectedMetricModal("min")}
                            />
                            <PremiumMetricCard 
                                title="متوسط درجات الطلاب" 
                                value={stats.avg.toFixed(1)} 
                                unit="درجة" 
                                icon={<TrendingUp className="h-5 w-5" />} 
                                description="معدل المتوسط الحسابي لعلامات الطلاب" 
                                onClick={() => setSelectedMetricModal("avg")}
                            />
                        </div>
                    </div>
                </div>

                {/* Unified Data Table Modal */}
                <Dialog 
                    open={!!selectedGradeForModal || !!selectedMetricModal} 
                    onOpenChange={() => {
                        setSelectedGradeForModal(null);
                        setSelectedMetricModal(null);
                    }}
                >
                    <DialogContent className="sm:max-w-md rounded-[2.5rem] border-slate-100 shadow-2xl" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className={`flex items-center gap-3 font-black text-xl text-slate-800`}>
                                <div className={`p-2.5 rounded-2xl ${
                                    selectedGradeForModal ? getGradeInfo(selectedGradeForModal).accent : 
                                    selectedMetricModal === "max" ? "bg-emerald-500" :
                                    selectedMetricModal === "min" ? "bg-rose-500" : "bg-blue-500"
                                } text-white shadow-sm`}>
                                    {selectedGradeForModal ? <Users className="w-5 h-5" /> : 
                                     selectedMetricModal === "max" ? <Award className="w-5 h-5" /> :
                                     selectedMetricModal === "min" ? <AlertCircle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                                </div>
                                <span>
                                    {selectedGradeForModal ? `طلاب بتقدير: ${selectedGradeForModal}` : 
                                     selectedMetricModal === "max" ? "أصحاب أعلى الدرجات" :
                                     selectedMetricModal === "min" ? "أصحاب أقل الدرجات" : "طلاب حول مستوى المتوسط"}
                                </span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="mt-6 max-h-[60vh] overflow-y-auto small-scroll pr-1">
                            {studentsForModal.length > 0 ? (
                                <ul className="space-y-3 pt-1">
                                    {studentsForModal
                                        .sort((a: any, b: any) => (b.finalScore || 0) - (a.finalScore || 0))
                                        .map((paper: any, idx: number) => (
                                            <li key={idx} className="flex justify-between items-center bg-slate-50/70 p-4 rounded-3xl border border-slate-100 hover:border-slate-200 transition-all group">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-slate-800 text-base">{paper.studentName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500 font-black bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">فصل: {paper.className}</span>
                                                        <span className="text-[10px] text-slate-500 font-black bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">رقم: {paper.barcode || idx + 1}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-xl font-black text-slate-800`}>
                                                        {(paper.finalScore || 0).toFixed(1)}
                                                        <span className="text-[11px] text-slate-400 mr-1">/ {paper.totalQuestions}</span>
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {((paper.finalScore / (paper.totalQuestions || 1)) * 100) >= 90 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                                        <span className="text-[10px] text-slate-500 font-black">بنسبة {(((paper.finalScore || 0) / paper.totalQuestions) * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            ) : (
                                <div className="py-16 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                                        <Users className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-black text-sm tracking-tight">لا يوجد طلاب يطابقون هذا المعيار حالياً</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 print:gap-3 md:grid-cols-3 mt-6 print:mt-2">
                <Card className="md:col-span-3 print:col-span-3 print:m-0 print:border-none print:shadow-none goal-chart-card">
                    <CardHeader className="print:p-2">
                        <CardTitle>نظرة عامة على أداء الفصل حسب الأهداف</CardTitle>
                        <CardDescription>تحليل الأهداف التعليمية للاختبار المحدد</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div ref={barChartRef} className="h-[320px] w-full bg-white p-2">
                            {classPerformanceData.labels.length > 0 ? (
                                <Bar
                                    data={classPerformanceData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        layout: {
                                            padding: {
                                                bottom: 25
                                            }
                                        },
                                        plugins: { 
                                            legend: { 
                                                position: 'bottom',
                                                labels: {
                                                    usePointStyle: true,
                                                    boxWidth: 8
                                                }
                                            } 
                                        },
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
            </div>

            <div className="grid gap-6 print:gap-3 md:grid-cols-3 print-stack">
                {/* Strengths Card */}
                <div className="bg-card rounded-2xl shadow-sm border print:border-slate-300 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 border-t-4 border-t-emerald-500 h-[480px] print:h-auto print:break-inside-auto">
                    <div className="flex items-center gap-3 p-5 print:p-2.5 border-b bg-emerald-500/5">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600"><Award className="h-5 w-5" /></div>
                        <div className="flex flex-col">
                            <h4 className="text-base font-black text-foreground">نقاط القوة (فوق 50%)</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">المهارات والأهداف المتقنة من قبل الفصل</p>
                        </div>
                        <span className="mr-auto text-xs font-black bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-full border border-emerald-500/20">
                            {classReport?.goalAnalysis.filter((g: any) => g.successRate >= 50).length} مهارات
                        </span>
                    </div>
                    <div className="flex flex-col gap-3 p-5 overflow-y-auto flex-1 small-scroll">
                        {classReport?.goalAnalysis
                            ?.filter((g: any) => g.successRate >= 50)
                            .sort((a: any, b: any) => b.successRate - a.successRate)
                            .map((g: any, i: number) => (
                                <div key={i} className="group p-3 bg-emerald-50/30 hover:bg-emerald-50/60 border border-emerald-100/50 rounded-xl flex flex-col gap-2 transition-all duration-200">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-sm font-bold text-foreground text-right leading-relaxed flex-1">{g.goalText}</span>
                                        <span className="text-xs font-black bg-emerald-500/10 text-emerald-700 border border-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">
                                            {(g.successRate ?? 0).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-emerald-100/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-l from-emerald-400 to-teal-500 rounded-full group-hover:opacity-90 transition-all" style={{ width: `${g.successRate}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        {(classReport?.goalAnalysis?.filter((g: any) => g.successRate >= 50).length ?? 0) === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                                <Award className="h-8 w-8 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground italic">لا توجد نقاط قوة مسجلة حتى الآن</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Weaknesses Card */}
                <div className="bg-card rounded-2xl shadow-sm border print:border-slate-300 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 border-t-4 border-t-rose-500 h-[480px] print:h-auto print:break-inside-auto">
                    <div className="flex items-center gap-3 p-5 print:p-2.5 border-b bg-rose-500/5">
                        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600"><AlertCircle className="h-5 w-5" /></div>
                        <div className="flex flex-col">
                            <h4 className="text-base font-black text-foreground">نقاط الضعف (أقل من 50%)</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">المهارات والأهداف التي تحتاج إلى دعم وتقوية</p>
                        </div>
                        <span className="mr-auto text-xs font-black bg-rose-500/10 text-rose-700 px-3 py-1 rounded-full border border-rose-500/20">
                            {(classReport?.goalAnalysis?.filter((g: any) => g.successRate < 50).length ?? 0)} مهارات
                        </span>
                    </div>
                    <div className="flex flex-col gap-3 p-5 overflow-y-auto flex-1 small-scroll">
                        {classReport?.goalAnalysis
                            ?.filter((g: any) => g.successRate < 50)
                            .sort((a: any, b: any) => a.successRate - b.successRate)
                            .map((g: any, i: number) => (
                                <div key={i} className="group p-3 bg-rose-50/30 hover:bg-rose-50/60 border border-rose-100/50 rounded-xl flex flex-col gap-2 transition-all duration-200">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-sm font-bold text-foreground text-right leading-relaxed flex-1">{g.goalText}</span>
                                        <span className="text-xs font-black bg-rose-500/10 text-rose-700 border border-rose-500/10 px-2 py-0.5 rounded-md shrink-0">
                                            {(g.successRate ?? 0).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-rose-100/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-l from-rose-400 to-red-500 rounded-full group-hover:opacity-90 transition-all" style={{ width: `${g.successRate}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        {(classReport?.goalAnalysis?.filter((g: any) => g.successRate < 50).length ?? 0) === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                <p className="text-sm text-muted-foreground italic">لا توجد نقاط ضعف مسجلة</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Therapeutic Plan Card */}
                <div className="bg-card rounded-2xl shadow-sm border print:border-slate-300 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 border-t-4 border-t-purple-500 h-[480px] print:h-auto print:break-inside-avoid">
                    <div className="flex items-center gap-3 p-5 print:p-2.5 border-b bg-purple-500/5">
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600"><Sparkles className="h-5 w-5" /></div>
                        <div className="flex flex-col">
                            <h4 className="text-base font-black text-foreground">الخطة العلاجية المقترحة</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">توصيات تعليمية لسد فجوات الفهم للفصل</p>
                        </div>
                    </div>
                    <div className="p-5 print:p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="bg-purple-50/20 p-4 print:p-2 rounded-xl border border-purple-100/50 h-full flex flex-col justify-start overflow-hidden">
                            {classReport && classReport.goalAnalysis.filter((g: any) => g.successRate < 50).length > 0 ? (
                                <div className="space-y-4 flex flex-col h-full overflow-hidden">
                                    <p className="text-sm font-bold text-purple-700 leading-relaxed shrink-0">
                                        بناءً على تحليل نتائج الفصل، نوصي بتخصيص وقت إضافي لمعالجة المهارات المتعثرة التالية:
                                    </p>
                                    <div className="overflow-y-auto flex-1 small-scroll pl-1">
                                        <ul className="space-y-3">
                                            {classReport.goalAnalysis.filter((g: any) => g.successRate < 50).map((g: any, index: number) => (
                                                <li key={index} className="flex items-start gap-2.5 text-sm text-purple-900/80 font-semibold leading-relaxed">
                                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <span>{g.goalText}</span>
                                                        <span className="text-xs font-bold text-rose-500 mr-2 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                                            ({g.successRate.toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-3 py-6">
                                    <div className="p-3 bg-emerald-50 rounded-full"><Sparkles className="h-8 w-8 text-emerald-500" /></div>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-bold text-center px-2">
                                        أداء الفصل متميز جداً ولا توجد أهداف متعثرة تتطلب خطة علاجية عاجلة. نوصي باستمرار تقديم تحديات إثرائية للحفاظ على التفوق.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
