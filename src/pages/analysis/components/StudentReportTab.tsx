import React from "react";
import { Loader2, Award, AlertCircle, FileText, CheckCircle2, AlertTriangle, Printer, Download, ClipboardList, Sparkles, Lightbulb, TrendingUp, CheckSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radar } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Exam, StudentReport, ExamPaper } from "../types";
import { getSemesterName } from "../utils";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface StudentReportTabProps {
    selectedExam: Exam | undefined;
    examPapers: ExamPaper[] | undefined;
    selectedPaperId: string;
    setSelectedPaperId: (val: string) => void;
    selectedClassId: string | undefined;
    isLoadingStudent: boolean;
    studentReport: StudentReport | undefined;
    radarData: any;
    radarChartRef: React.RefObject<HTMLDivElement>;
    strengthRadarChartRef: React.RefObject<HTMLDivElement>;
    weaknessRadarChartRef: React.RefObject<HTMLDivElement>;
}

export const StudentReportTab = ({
    selectedExam,
    examPapers,
    selectedPaperId,
    setSelectedPaperId,
    selectedClassId,
    isLoadingStudent,
    studentReport,
    radarData,
    radarChartRef,
    strengthRadarChartRef,
    weaknessRadarChartRef
}: StudentReportTabProps) => {
    const strengthRadarData = {
        labels: studentReport?.goalAnalysis
            ?.filter((g: any) => g.successRate >= 50)
            ?.map((g: any) => g.goalText) || [],

        datasets: [{
            data: studentReport?.goalAnalysis
                ?.filter((g: any) => g.successRate >= 50)
                ?.map((g: any) => g.successRate) || [],
            backgroundColor: "rgba(45,212,191,.2)",
            borderColor: "#14b8a6",
            borderWidth: 2
        }]
    };

    const weaknessRadarData = {
        labels: studentReport?.goalAnalysis
            ?.filter((g: any) => g.successRate < 50)
            ?.map((g: any) => g.goalText) || [],

        datasets: [{
            data: studentReport?.goalAnalysis
                ?.filter((g: any) => g.successRate < 50)
                ?.map((g: any) => g.successRate) || [],
            backgroundColor: "rgba(251,113,133,.2)",
            borderColor: "#f43f5e",
            borderWidth: 2
        }]
    };
    return (
        <div className="space-y-6 print:space-y-4 print:m-0 print:p-0 w-full print:w-full print:max-w-none bg-background print:bg-white text-foreground print:text-black" dir="rtl">
            <style>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 15mm;
                    }
                    body {
                        background: white !important;
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    .student-radar-container canvas {
                        max-height: 280px !important;
                        margin: 0 auto;
                    }
                    .student-small-radar canvas {
                        max-height: 220px !important;
                        margin: 0 auto;
                    }
                }
            `}</style>
            {/* Student Selector Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50 print:hidden">
                <span className="font-bold whitespace-nowrap">اختر الطالب:</span>
                <div className="w-full md:w-72">
                    <Select value={selectedPaperId} onValueChange={setSelectedPaperId}>
                        <SelectTrigger className="h-11 shadow-sm bg-white">
                            <SelectValue placeholder="اختر اسم الطالب" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {examPapers?.filter((p: any) => !selectedClassId || selectedClassId === "all" || p.className === selectedClassId).map((paper: any) => (
                                <SelectItem key={paper.id} value={paper.id.toString()}>
                                    {paper.studentName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center h-11">
                    {selectedPaperId && examPapers?.find((p: any) => p.id.toString() === selectedPaperId) && (
                        <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm flex-row-reverse border border-primary/20 font-bold">
                            <span className="mr-1">{examPapers.find((p: any) => p.id.toString() === selectedPaperId)?.className}</span> :الفصل
                        </div>
                    )}
                </div>
            </div>

            {selectedPaperId ? (
                isLoadingStudent ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : studentReport ? (
                    <div className="flex flex-col gap-6 w-full mt-6 print:mt-0 print:gap-4 w-full">
                        {/* Student Summary Bar */}
                        <div className="flex flex-col md:flex-row print:flex-row flex-wrap print:flex-nowrap items-center justify-between print:justify-center gap-4 print:gap-2 p-4 md:p-6 md:px-10 print:p-4 bg-card print:bg-[#fcfcfc] rounded-2xl md:rounded-[2rem] print:rounded-[10px] shadow-sm print:shadow-none border print:border print:border-[#d9e2ec] overflow-visible print:w-full">
                            <div className="flex flex-wrap print:flex-nowrap items-center justify-center gap-4 print:gap-2 md:gap-8 w-full md:w-auto">
                                <div className="flex items-center gap-2 print:gap-1 md:gap-3">
                                    <span className="text-sm md:text-lg print:text-xs font-bold text-muted-foreground whitespace-nowrap">اسم الطالب:</span>
                                    <span className="text-base md:text-xl print:text-xs font-black text-foreground">{examPapers?.find((p: any) => p.id.toString() === selectedPaperId)?.studentName}</span>
                                </div>
                                <div className="hidden md:block print:block h-8 w-[1px] bg-border print:mx-1"></div>
                                <div className="flex items-center gap-2 print:gap-1 md:gap-3">
                                    <span className="text-sm md:text-lg print:text-xs font-bold text-muted-foreground whitespace-nowrap">فصل:</span>
                                    <span className="text-base md:text-xl print:text-xs font-black text-foreground">{examPapers?.find((p: any) => p.id.toString() === selectedPaperId)?.className}</span>
                                </div>
                                <div className="hidden md:block print:block h-8 w-[1px] bg-border print:mx-1"></div>
                                <div className="flex items-center gap-2 print:gap-1 md:gap-3">
                                    <span className="text-sm md:text-lg print:text-xs font-bold text-muted-foreground whitespace-nowrap">المادة:</span>
                                    <span className="text-base md:text-xl print:text-xs font-black text-foreground">{selectedExam?.subject}</span>
                                </div>
                                <div className="hidden md:block print:block h-8 w-[1px] bg-border print:mx-1"></div>
                                <div className="flex items-center gap-2 print:gap-1 md:gap-3">
                                    <span className="text-sm md:text-lg print:text-xs font-bold text-muted-foreground whitespace-nowrap">الاختبار:</span>
                                    <span className="text-base md:text-xl print:text-xs font-black text-foreground">{selectedExam ? getSemesterName(selectedExam.createdAt) : ''}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap print:flex-nowrap items-center gap-4 print:gap-2 md:gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-r border-border pr-0 md:pr-8 border-r-0 print:mt-0 print:pt-0 print:border-t-0 print:border-r print:pr-2">
                                <div className="flex items-center gap-2 print:gap-1 md:gap-3">
                                    <span className="text-sm md:text-lg print:text-xs font-bold text-muted-foreground whitespace-nowrap">النتيجة:</span>
                                    <span className="text-base md:text-xl print:text-xs font-black text-blue-600">
                                        {studentReport.totalCorrect}/{examPapers?.find((p: any) => p.id.toString() === selectedPaperId)?.totalQuestions || studentReport.goalAnalysis.length} ({(studentReport.percentage ?? 0).toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="hidden md:block print:block h-8 w-[1px] bg-border print:mx-1"></div>
                                <div className="flex items-center gap-2 print:gap-1 md:gap-3">
                                    <span className="text-sm md:text-lg print:text-xs font-bold text-muted-foreground whitespace-nowrap">الحالة:</span>
                                    <span className={`text-base md:text-xl print:text-xs font-black
                                        ${(studentReport.percentage ?? 0) >= 90 ? "text-emerald-600"
                                            : (studentReport.percentage ?? 0) >= 80 ? "text-green-500"
                                                : (studentReport.percentage ?? 0) >= 70 ? "text-blue-500"
                                                    : (studentReport.percentage ?? 0) >= 50 ? "text-amber-500"
                                                        : "text-rose-500"
                                        }`}
                                    >
                                        {
                                            (studentReport.percentage ?? 0) >= 90 ? "امتياز"
                                                : (studentReport.percentage ?? 0) >= 80 ? "جيد جدًا"
                                                    : (studentReport.percentage ?? 0) >= 70 ? "جيد"
                                                        : (studentReport.percentage ?? 0) >= 50 ? "مقبول"
                                                            : "ضعيف - بحاجة لدعم"
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* General Performance Radar Card */}

                        <div className="bg-card print:bg-[#ffffff] rounded-2xl print:rounded-[10px] p-6 print:p-4 print:pb-2 shadow-sm print:shadow-none border print:border print:border-[#e2e8f0] flex flex-col items-center w-full print:w-full print:flex print:break-inside-avoid print:mb-2 text-foreground print:text-black">

                            <div className="flex items-center justify-between w-full mb-6 print:mb-2" dir="rtl">

                                <div>
                                    <h3 className="text-lg font-bold">
                                        الأداء العام للطالب
                                    </h3>

                                    <p className="text-xs text-muted-foreground">
                                        مقارنة بمتوسط الفصل
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">

                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-3 rounded bg-blue-400"></div>

                                        <span className="text-xs">
                                            أداء الطالب
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">

                                        <div className="w-6 h-3 rounded bg-pink-400"></div>

                                        <span className="text-xs">
                                            متوسط الفصل
                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div
                                className="w-full h-[430px] print:h-[280px] student-radar-container flex justify-center items-center"
                                ref={radarChartRef}
                            >

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
                                                    font: { size: 10 },
                                                    color: "#94a3b8",
                                                    backdropColor: "transparent"
                                                },

                                                grid: {
                                                    color: "#e2e8f0"
                                                },

                                                angleLines: {
                                                    color: "#e2e8f0"
                                                },

                                                pointLabels: {

                                                    font: {
                                                        size: 11,
                                                        family: 'Cairo',
                                                        weight: 'bold'
                                                    },

                                                    callback: function (label: string) {

                                                        const words = label.split(" ");

                                                        const lines = [];

                                                        let current = '';

                                                        words.forEach((w) => {

                                                            if (
                                                                current.length + w.length > 20
                                                            ) {

                                                                lines.push(current);

                                                                current = w + " ";

                                                            } else {

                                                                current += w + " ";

                                                            }

                                                        })

                                                        lines.push(current);

                                                        return lines;

                                                    }

                                                }

                                            }
                                        },

                                        plugins: {
                                            legend: {
                                                display: false
                                            }
                                        }

                                    }}
                                />

                            </div>

                        </div>


                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-6 print:w-full print:break-inside-avoid">

                            {/* القوة */}

                            <div className="bg-card print:bg-white rounded-2xl border print:border print:border-[#e2e8f0] print:border-t-4 print:border-t-teal-500 overflow-hidden print:w-full print:shadow-none text-foreground print:text-black">

                                <div className="p-4 border-b bg-teal-50 print:bg-[#fcfcfc] print:px-4 print:py-2">

                                    <h4 className="font-bold">
                                        نقاط القوة
                                    </h4>

                                </div>

                                <div className="p-4 space-y-4">

                                    {studentReport.goalAnalysis
                                        .filter((g: any) => g.successRate >= 50)
                                        .slice(0, 5)
                                        .map((g: any, i: number) => (

                                            <div key={i}>

                                                <div className="flex justify-between text-sm">

                                                    <span>{g.goalText}</span>

                                                    <span className="font-bold text-teal-600">
                                                        {g.successRate.toFixed(0)}%
                                                    </span>

                                                </div>

                                                <div className="h-2 rounded bg-slate-100 mt-2">

                                                    <div
                                                        className="h-full bg-teal-500 rounded"
                                                        style={{
                                                            width: `${g.successRate}%`
                                                        }}
                                                    ></div>

                                                </div>

                                            </div>

                                        ))}

                                </div>

                                <div
                                    className="h-[250px] print:h-[220px] student-small-radar flex justify-center items-center"
                                    ref={strengthRadarChartRef}
                                >

                                    <Radar
                                        data={strengthRadarData}
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            }
                                        }}
                                    />

                                </div>

                            </div>



                            {/* الضعف */}

                            <div className="bg-card print:bg-white rounded-2xl border print:border print:border-[#e2e8f0] print:border-t-4 print:border-t-rose-500 overflow-hidden print:w-full print:shadow-none text-foreground print:text-black">

                                <div className="p-4 border-b bg-rose-50 print:bg-[#fcfcfc] print:px-4 print:py-2">

                                    <h4 className="font-bold">
                                        نقاط الضعف
                                    </h4>

                                </div>

                                <div className="p-4 space-y-4">

                                    {studentReport.goalAnalysis
                                        .filter((g: any) => g.successRate < 50)
                                        .slice(0, 5)
                                        .map((g: any, i: number) => (

                                            <div key={i}>

                                                <div className="flex justify-between text-sm">

                                                    <span>{g.goalText}</span>

                                                    <span className="font-bold text-rose-600">

                                                        {g.successRate.toFixed(0)}%

                                                    </span>

                                                </div>

                                                <div className="h-2 rounded bg-slate-100 mt-2">

                                                    <div
                                                        className="h-full bg-rose-500 rounded"
                                                        style={{
                                                            width: `${g.successRate}%`
                                                        }}
                                                    ></div>

                                                </div>

                                            </div>

                                        ))}

                                </div>

                                <div
                                    className="h-[250px] print:h-[220px] student-small-radar flex justify-center items-center"
                                    ref={weaknessRadarChartRef}
                                >

                                    <Radar
                                        data={weaknessRadarData}
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            }
                                        }}
                                    />

                                </div>

                            </div>

                        </div>

                        {/* AI Recommendations Section */}
                        {studentReport.goalAnalysis && studentReport.goalAnalysis.length > 0 && (
                            <div className="bg-card print:bg-white rounded-2xl p-6 print:p-4 shadow-sm print:shadow-none border print:border print:border-[#e2e8f0] print:border-r-4 print:border-r-indigo-500 mt-2 print:mt-1 mb-4 print:mb-2 relative overflow-hidden print:break-inside-avoid print:w-full text-foreground print:text-black">
                                <div className="absolute -left-6 -top-6 w-24 h-24 bg-primary/5 rounded-full opacity-50 blur-2xl print:hidden"></div>
                                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full opacity-50 blur-2xl print:hidden"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-5" dir="rtl">
                                        <div className="p-2 bg-primary/10 rounded-lg print:bg-transparent print:p-0">
                                            <Lightbulb className="w-5 h-5 text-primary print:text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">نصائح مخصصة للطالب</h3>
                                            <p className="text-xs font-medium text-muted-foreground mt-0.5 print:hidden">خطوات عملية لتحسين المستوى الأكاديمي بناءً على تحليل الإجابات</p>
                                        </div>
                                    </div>

                                    <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 print:p-0 border print:border-0 shadow-sm print:shadow-none" dir="rtl">
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
                            <div className="bg-card print:bg-[#ffffff] rounded-2xl p-6 print:p-6 shadow-sm print:shadow-none border print:border print:border-[#e2e8f0] mt-2 print:mt-6 print:w-full">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6" dir="rtl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                        <h3 className="text-xl font-bold text-foreground">تفاصيل الإجابات</h3>
                                    </div>
                                    <div className="flex gap-4 p-2.5 bg-muted print:bg-transparent rounded-xl border print:border-0">
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

                                <div className="pb-2 rounded-xl border print:border print:border-[#e2e8f0] print:rounded-[8px] overflow-hidden">
                                    <table className="w-full text-right border-collapse bg-card print:bg-white">
                                        <thead className="bg-muted print:bg-[#fcfcfc] border-b print:border-[#e2e8f0]">
                                            <tr>
                                                <th className="px-5 py-4 print:py-2 text-sm font-bold text-muted-foreground print:text-foreground text-center">التقييم</th>
                                                <th className="px-5 py-4 print:py-2 text-sm font-bold text-muted-foreground print:text-foreground border-l print:border-border text-center">الإجابة الصحيحة</th>
                                                <th className="px-5 py-4 print:py-2 text-sm font-bold text-muted-foreground print:text-foreground border-l print:border-border text-center">إجابة الطالب</th>
                                                <th className="px-5 py-4 print:py-2 text-sm font-bold text-muted-foreground print:text-foreground border-l print:border-border text-center"> السؤال</th>

                                            </tr>
                                        </thead>
                                        <tbody className="divide-y print:divide-[#e2e8f0]">
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
                                                    <tr key={questionNum} className="hover:bg-accent/50 transition-colors print:break-inside-avoid">
                                                        <td className="px-5 py-4 print:py-2 text-center">
                                                            <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold
                                                                                ${answer.ok
                                                                    ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20 print:bg-transparent print:border-0'
                                                                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20 print:bg-transparent print:border-0'}`}
                                                            >
                                                                {answer.ok ? (
                                                                    <><CheckSquare className="w-3.5 h-3.5" /> صحيحة</>
                                                                ) : (
                                                                    <><AlertTriangle className="w-3.5 h-3.5" /> خاطئة</>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 print:py-2 text-center border-l print:border-border">
                                                            <span className="text-base font-bold text-foreground">
                                                                {formatAnswer(answer.gt)}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 print:py-2 text-center border-l print:border-border">
                                                            <span className={`text-base font-bold ${answer.ok ? 'text-teal-600' : 'text-rose-500 line-through decoration-rose-300'}`}>
                                                                {formatAnswer(answer.pred)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 print:py-2 text-center font-bold text-primary print:text-foreground border-l print:border-border">{questionNum} {displayType}</td>

                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-center py-20 text-muted-foreground">حدث خطأ أثناء تحميل بيانات الطالب</div>
                )
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/50">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">يرجى اختيار طالب من القائمة أعلاه لعرض تقريره بالتفصيل</p>
                </div>
            )}
        </div>


    );

};
