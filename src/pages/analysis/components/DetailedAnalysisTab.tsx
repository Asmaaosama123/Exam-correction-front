import React from "react";
import { Bar } from 'react-chartjs-2';
import type { Exam, ClassReport } from "../types";

interface DetailedAnalysisTabProps {
    classReport: ClassReport | undefined;
    selectedExam: Exam | undefined;
    displayClassName: string;
    classQuestionBarChartRef: React.RefObject<HTMLDivElement>;
}

export const DetailedAnalysisTab = ({
    classReport,
    selectedExam,
    displayClassName,
    classQuestionBarChartRef
}: DetailedAnalysisTabProps) => {

    // Construct chart data dynamically from question analysis
    const sortedQuestions = [...(classReport?.questionAnalysis || [])].sort((a, b) => a.questionNumber - b.questionNumber);
    const questionLabels = sortedQuestions.map((q: any) => `السؤال ${q.questionNumber}`);
    const questionSuccessRates = sortedQuestions.map((q: any) => q.successRate);

    const questionPerformanceData = {
        labels: questionLabels,
        datasets: [
            {
                label: 'نسبة النجاح (%)',
                data: questionSuccessRates,
                backgroundColor: questionSuccessRates.map((rate: number) =>
                    rate >= 80 ? 'rgba(16, 185, 129, 0.8)' : // Emerald
                        rate >= 60 ? 'rgba(59, 130, 246, 0.8)' : // Blue
                            rate >= 40 ? 'rgba(245, 158, 11, 0.8)' : // Amber
                                'rgba(244, 63, 94, 0.8)' // Rose
                ),
                borderColor: questionSuccessRates.map((rate: number) =>
                    rate >= 80 ? 'rgb(16, 185, 129)' :
                        rate >= 60 ? 'rgb(59, 130, 246)' :
                            rate >= 40 ? 'rgb(245, 158, 11)' :
                                'rgb(244, 63, 94)'
                ),
                borderWidth: 1,
                borderRadius: 4,
            }
        ]
    };

    return (
        <div className="space-y-6 print:m-0 print:space-y-4 print:w-full print:max-w-none print:block" dir="rtl">
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait; /* Using portrait so the chart has room to be tall and table fits below, or landscape if preferred. Usually detailed is better landscape? User screenshot selected Landscape. */
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    body {
                        background: white !important;
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    .detailed-chart-card {
                        page-break-inside: avoid;
                        height: auto !important;
                        min-height: 400px !important;
                        width: 100% !important;
                        margin-bottom: 20px !important;
                    }
                    .detailed-chart-card canvas {
                        height: 380px !important;
                        width: 100% !important;
                    }
                    table { page-break-inside: auto; width: 100% !important; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                }
            `}</style>

            <div className="grid grid-cols-1 gap-6 mb-8 mt-6 print:!block print:my-0 print:w-full print:max-w-none">
                <div className="detailed-chart-card bg-card rounded-2xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 print:shadow-none print:border-slate-300 print:rounded-md print:w-full">
                    <div className="flex items-center gap-3 p-5 border-b bg-primary/5 print:bg-slate-50 print:p-4">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-primary to-primary-focus rounded-full print:hidden"></div>
                        <h4 className="text-lg font-black text-foreground print:text-base">التحليل الإحصائي لأداء الأسئلة</h4>
                        <p className="text-xs font-bold text-muted-foreground mr-auto bg-primary/10 px-3 py-1 rounded-full print:bg-transparent print:border print:border-slate-200">نسب الإجابات الصحيحة لكل سؤال في النموذج</p>
                    </div>
                    <div className="p-6 bg-white relative print:p-2 w-full">
                        <div ref={classQuestionBarChartRef} className="h-[450px] w-full print:h-[380px] print:w-full relative">
                            {classReport && classReport.questionAnalysis && classReport.questionAnalysis.length > 0 ? (
                                <Bar
                                    data={questionPerformanceData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                rtl: true,
                                                titleFont: { family: 'Cairo', size: 14, weight: 'bold' as const },
                                                bodyFont: { family: 'Cairo', size: 13 },
                                                padding: 12,
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                callbacks: {
                                                    label: (context: any) => `نسبة النجاح: ${context.parsed.y?.toFixed(1) ?? 0}%`
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                min: 0,
                                                max: 100,
                                                ticks: { font: { family: 'Cairo', weight: 'bold' as const } },
                                                grid: { color: 'rgba(0, 0, 0, 0.05)' }
                                            },
                                            x: {
                                                ticks: { font: { family: 'Cairo', weight: 'bold' as const } },
                                                grid: { display: false }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-500 font-bold mb-2">لا تتوفر بيانات كافية لعرض الرسم البياني</p>
                                        <p className="text-xs text-slate-400">تأكد من تحليل أوراق إجابات الطلاب لهذا الفصل أولاً</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden print:shadow-none print:border-slate-300 print:rounded-md print:w-full">
                    <div className="flex items-center gap-3 p-5 border-b bg-slate-50 print:p-4">
                        <h4 className="text-base font-black text-foreground print:text-base">سجل تفصيلي بنسب نجاح الأسئلة</h4>
                    </div>
                    <div className="p-0 overflow-x-auto print:overflow-visible print:w-full">
                        <table className="w-full text-right border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700">
                                    <th className="py-4 px-4 font-black">رقم السؤال</th>
                                    <th className="py-4 px-4 font-black text-center">الإجابات الصحيحة</th>
                                    <th className="py-4 px-4 font-black text-center">إجمالي الإجابات</th>
                                    <th className="py-4 px-4 font-black text-center">نسبة النجاح</th>
                                    <th className="py-4 px-4 font-black text-center">مستوى الصعوبة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedQuestions.map((q: any, i: number) => {
                                    const diffLevel = q.successRate >= 80 ? { text: "سهل", color: "text-emerald-600 bg-emerald-50", line: "border-emerald-200" } :
                                        q.successRate >= 60 ? { text: "متوسط", color: "text-blue-600 bg-blue-50", line: "border-blue-200" } :
                                            q.successRate >= 40 ? { text: "صعب", color: "text-amber-600 bg-amber-50", line: "border-amber-200" } :
                                                { text: "شديد الصعوبة", color: "text-rose-600 bg-rose-50", line: "border-rose-200" };

                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-800">السؤال {q.questionNumber}</td>
                                            <td className="py-3 px-4 text-center text-slate-600 font-bold">{q.correctCount}</td>
                                            <td className="py-3 px-4 text-center text-slate-600 font-bold">{classReport?.totalStudents}</td>
                                            <td className="py-3 px-4 text-center font-black" dir="ltr" style={{ color: diffLevel.color.split(' ')[0].replace('text-', 'var(--').replace('-600', '-600)') }}>{q.successRate.toFixed(1)}%</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`text-xs font-black px-3 py-1 rounded-full border ${diffLevel.color} ${diffLevel.line}`}>
                                                    {diffLevel.text}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {sortedQuestions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500 font-bold bg-slate-50/50">
                                            لم يتم العثور على أي أسئلة لتحليلها
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
