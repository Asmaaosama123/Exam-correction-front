import React, { forwardRef, useMemo } from "react";
import { Bar } from 'react-chartjs-2';
import { getHijriYearOnly, getSemesterName } from "../utils";
import { TrendingUp, Award, AlertCircle, Users, CheckCircle2, AlertTriangle } from "lucide-react";

interface SummaryPrintTemplateProps {
    classReport: any;
    stats: any;
    displayClassName: string;
    selectedExam: any;
    classPerformanceData: any;
    examPapers?: any[];
    selectedClassId?: string;
}

export const SummaryPrintTemplate = forwardRef<HTMLDivElement, SummaryPrintTemplateProps>(({
    classReport,
    stats,
    displayClassName,
    selectedExam,
    classPerformanceData,
    examPapers,
    selectedClassId
}, ref) => {

    const weakGoals = useMemo(() => {
        if (!classReport?.goalAnalysis) return [];
        return classReport.goalAnalysis
            .filter((g: any) => g.successRate < 50)
            .sort((a: any, b: any) => a.successRate - b.successRate);
    }, [classReport]);

    const filteredStudents = useMemo(() => {
        if (!examPapers) return [];
        let students = examPapers.filter((p: any) => p.finalScore !== null && p.finalScore !== undefined);
        if (selectedClassId && selectedClassId !== "all") {
            students = students.filter((p: any) => p.className === selectedClassId);
        }
        return students.sort((a: any, b: any) => b.finalScore - a.finalScore);
    }, [examPapers, selectedClassId]);

    const coloredPerformanceData = useMemo(() => {
        if (!classPerformanceData || !classPerformanceData.datasets || classPerformanceData.datasets.length === 0) return classPerformanceData;
        const newData = { ...classPerformanceData };
        newData.datasets = classPerformanceData.datasets.map((dataset: any) => {
            const newDataset = { ...dataset };
            newDataset.backgroundColor = dataset.data.map((val: number) => {
                if (val >= 80) return '#10b981'; // أخضر
                if (val >= 65) return '#3b82f6'; // لبني
                if (val >= 50) return '#eab308'; // أصفر
                return '#f43f5e'; // أحمر
            });
            newDataset.borderWidth = 0;
            newDataset.maxBarThickness = 40;
            newDataset.borderRadius = { topLeft: 4, topRight: 4 };
            return newDataset;
        });
        return newData;
    }, [classPerformanceData]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        layout: { padding: { top: 20, bottom: 30 } },
        plugins: { 
            legend: { 
                position: 'bottom' as const, 
                labels: { 
                    font: { family: "'Cairo', sans-serif" },
                    usePointStyle: true,
                    boxWidth: 8
                } 
            }
        },
        scales: { 
            y: { min: 0, max: 100, ticks: { font: { family: "'Cairo', sans-serif" } }, grid: { color: '#f1f5f9' } },
            x: { 
                grid: { display: false },
                ticks: { 
                    font: { family: "'Cairo', sans-serif", size: 11, weight: 'bold' as const }
                } 
            }
        }
    };

    if (!classReport) return <div ref={ref} className="hidden" />;

    const passRate = ((stats.count - stats.criticalCount) / (stats.count || 1) * 100).toFixed(0);
    const currentDate = new Date().toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' });

    return (
        <div ref={ref} className="bg-white text-black" dir="rtl" style={{ width: '100%', fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>

            {/* --- Global Print CSS Settings --- */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700;900&display=swap');
                
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
                    .page-break {
                        padding-top: 10px;
                        margin-top: 10px;
                        border-top: 1px dashed #e2e8f0;
                    }
                    .avoid-break {
                        page-break-inside: avoid;
                    }
                    /* Fixed Footer for Every Page */
                    .print-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 30px;
                        display: flex !important;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 10px;
                        color: #64748b;
                        border-top: 1px solid #cbd5e1;
                        background: white;
                    }
                    
                    /* Chart Layout Fixes */
                    .goal-chart-card {
                       height: 340px !important;
                       min-height: 340px !important;
                       overflow: visible !important;
                       padding-bottom: 30px !important;
                    }
                    .goal-chart-card canvas {
                       height: 300px !important;
                       width: 100% !important;
                       overflow: visible !important;
                    }
                }
            `}</style>

            {/* Repeating Footer (Uses fixed position trick for print) */}
            <div className="print-footer hidden print:flex z-50">
                <span>وسيلة | نظام التصحيح والتحليل المتقدم</span>
                <span>تاريخ التقرير: {currentDate}</span>
            </div>

            <div style={{ background: '#fff', border: '1px solid #dfe6e9', borderRadius: '14px', padding: '20px', width: '100%', boxShadow: 'none' }}>
                
                {/* ======================= PAGE 1 ======================= */}
                <div className="avoid-break">
                    {/* App Simple Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ backgroundColor: '#10b981', padding: '6px', borderRadius: '8px', color: '#fff' }}>
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>نظام وسيلة | التصحيح الذكي والتحليل</div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>تقرير تحليلي تلقائي لنتائج {getSemesterName(selectedExam?.createdAt)}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '10px', color: '#64748b' }}>
                            <div>تاريخ التقرير: {currentDate}</div>
                        </div>
                    </div>

                    {/* Horizontal Info Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        {[
                            { label: 'الفصل', value: displayClassName },
                            { label: 'المادة', value: selectedExam?.subject },
                            { label: 'السنة الدراسية', value: getHijriYearOnly(selectedExam?.createdAt) },
                            { label: 'الاختبار', value: getSemesterName(selectedExam?.createdAt) },
                            { label: 'الدرجة النهائية', value: `${stats.maxScore} درجة`, color: '#10b981' }
                        ].map((info, idx) => (
                            <div key={idx} style={{ border: '1px solid #d9e2ec', borderRadius: '10px', padding: '10px', textAlign: 'center', backgroundColor: '#fcfcfc', boxShadow: 'none' }}>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{info.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: info.color || '#0f172a' }}>{info.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Top KPI Tables Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        
                        {/* Grid 1: 4 KPIs */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            {[
                                { label: 'متوسط الفصل', value: stats.avg.toFixed(1), sub: `/ ${stats.maxScore}`, color: '#10b981', subColor: '#94a3b8' },
                                { label: 'نسبة النجاح', value: `${passRate}%`, color: '#3b82f6', subColor: '' },
                                { label: 'عدد الطلاب', value: stats.count, sub: 'طالب', color: '#8b5cf6', subColor: '#94a3b8' },
                                { label: 'تدخل عاجل', value: stats.criticalCount, sub: 'طالب', color: '#f43f5e', subColor: '#94a3b8' },
                            ].map((kpi, idx) => (
                                <div key={idx} style={{ 
                                    padding: '12px', 
                                    backgroundColor: '#fff', 
                                    borderBottom: idx < 2 ? '1px solid #e2e8f0' : 'none',
                                    borderLeft: idx % 2 === 0 ? '1px solid #e2e8f0' : 'none',
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    WebkitPrintColorAdjust: 'exact',
                                    printColorAdjust: 'exact'
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>{kpi.label}</span>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: kpi.color }}>
                                        {kpi.value} {kpi.sub && <span style={{ fontSize: '12px', color: kpi.subColor }}>{kpi.sub}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grid 2: Highest / Lowest */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            {[
                                { label: 'أعلى درجة', value: filteredStudents.length > 0 ? filteredStudents[0].finalScore : '-', color: '#10b981' },
                                { label: 'أقل درجة', value: filteredStudents.length > 0 ? filteredStudents[filteredStudents.length - 1].finalScore : '-', color: '#f43f5e' },
                            ].map((kpi, idx) => (
                                <div key={idx} style={{ 
                                    padding: '12px', 
                                    backgroundColor: '#fff', 
                                    borderLeft: idx % 2 === 0 ? '1px solid #e2e8f0' : 'none',
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    WebkitPrintColorAdjust: 'exact',
                                    printColorAdjust: 'exact'
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>{kpi.label}</span>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: kpi.color }}>
                                        {kpi.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grade Distribution - Horizontal (Cards with Rings - Smaller) */}
                    <div className="avoid-break" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '20px' }}>
                        {[
                            { label: 'ضعيف', count: stats.levels.weak.count, pct: stats.levels.weak.percentage, color: '#f43f5e', range: `0 - ${(0.5 * (stats.maxScore || 20)).toFixed(1)}` },
                            { label: 'مقبول', count: stats.levels.acceptable.count, pct: stats.levels.acceptable.percentage, color: '#f59e0b', range: `${(0.5 * (stats.maxScore || 20)).toFixed(1)} - ${(0.7 * (stats.maxScore || 20)).toFixed(1)}` },
                            { label: 'جيد', count: stats.levels.good.count, pct: stats.levels.good.percentage, color: '#3b82f6', range: `${(0.7 * (stats.maxScore || 20)).toFixed(1)} - ${(0.8 * (stats.maxScore || 20)).toFixed(1)}` },
                            { label: 'جيد جداً', count: stats.levels.veryGood.count, pct: stats.levels.veryGood.percentage, color: '#0d9488', range: `${(0.8 * (stats.maxScore || 20)).toFixed(1)} - ${(0.9 * (stats.maxScore || 20)).toFixed(1)}` },
                            { label: 'ممتاز', count: stats.levels.excellent.count, pct: stats.levels.excellent.percentage, color: '#10b981', range: `${(0.9 * (stats.maxScore || 20)).toFixed(1)} - ${(stats.maxScore || 20).toFixed(1)}` }
                        ].map((g, i) => {
                            const radius = 18;
                            const stroke = 3.5;
                            const normalizedRadius = radius - stroke * 2;
                            const circumference = normalizedRadius * 2 * Math.PI;
                            const strokeDashoffset = circumference - ((g.pct === 0 ? 1 : g.pct) / 100) * circumference;

                            return (
                                <div key={i} style={{ 
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                    padding: '10px 4px', backgroundColor: '#fff', 
                                    border: '1px solid #e2e8f0', borderRadius: '12px',
                                }}>
                                    {/* SVG Ring (Smaller) */}
                                    <div style={{ marginBottom: '8px', position: 'relative', width: '36px', height: '36px' }}>
                                        <svg height="36" width="36" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle
                                                stroke="#f1f5f9"
                                                fill="transparent"
                                                strokeWidth={stroke}
                                                r={normalizedRadius}
                                                cx={radius}
                                                cy={radius}
                                                style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                                            />
                                            <circle
                                                stroke={g.color}
                                                fill="transparent"
                                                strokeWidth={stroke}
                                                strokeDasharray={circumference + ' ' + circumference}
                                                style={{ strokeDashoffset: g.pct === 0 ? circumference : strokeDashoffset, strokeLinecap: 'round', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                                                r={normalizedRadius}
                                                cx={radius}
                                                cy={radius}
                                            />
                                        </svg>
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>{g.label}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '9.5px', color: '#64748b' }}>
                                        <span style={{ fontWeight: 'bold' }}>{g.count} طلاب</span>
                                        <span style={{ direction: 'ltr' }}>{g.range}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Full Width Goals Chart */}
                    <div className="avoid-break" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>أداء الطلاب حسب الأهداف</h3>
                        </div>
                        <div className="goal-chart-card" style={{ width: '100%', height: '340px', overflow: 'visible' }}>
                            {coloredPerformanceData && coloredPerformanceData.labels.length > 0 ? (
                                <Bar data={coloredPerformanceData} options={chartOptions} />
                            ) : (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>لا توجد بيانات أهداف مسجلة لهذا الاختبار</div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Analysis Layout - 2fr 1fr */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }} className="avoid-break w-full">
                        
                        {/* Strengths Column (Large Width) */}
                        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', boxShadow: 'none', borderTop: '4px solid #10b981', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ padding: '8px 12px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Award size={14} color="#10b981" />
                                <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>أبرز نقاط القوة (أعلى من 50%)</h3>
                            </div>
                            <div style={{ padding: '12px' }}>
                                {classReport?.goalAnalysis?.filter((g: any) => g.successRate >= 50).length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                        {classReport.goalAnalysis.filter((g: any) => g.successRate >= 50).sort((a: any, b: any) => b.successRate - a.successRate).map((g: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                                <span style={{ fontSize: '11px', color: '#334155', fontWeight: '600', lineHeight: '1.4' }}>{g.goalText}</span>
                                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>{g.successRate.toFixed(0)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '11px' }}>لا يوجد نقاط قوة مسجلة</div>
                                )}
                            </div>
                        </div>

                        {/* Weaknesses & Plan Column (Stacked) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            
                            {/* Weaknesses */}
                            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', boxShadow: 'none', borderTop: '4px solid #f43f5e', borderRadius: '10px', overflow: 'hidden', flex: 1 }}>
                                <div style={{ padding: '8px 12px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={14} color="#f43f5e" />
                                    <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>نقاط الضعف</h3>
                                </div>
                                <div style={{ padding: '8px' }}>
                                    {weakGoals.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {weakGoals.map((g: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px', backgroundColor: '#fff1f2', borderRadius: '4px' }}>
                                                    <span style={{ fontSize: '10px', color: '#be123c', fontWeight: '600' }}>{g.goalText}</span>
                                                    <span style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 'bold' }}>{g.successRate.toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '10px 0', color: '#94a3b8', fontSize: '10px' }}>لا توجد نقاط ضعف</div>
                                    )}
                                </div>
                            </div>

                            {/* Plan */}
                            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', boxShadow: 'none', borderTop: '4px solid #8b5cf6', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ padding: '8px 12px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>توصيات الخطة العلاجية</h3>
                                </div>
                                <div style={{ padding: '10px' }}>
                                    {weakGoals.length > 0 ? (
                                        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                            {weakGoals.map((g: any, i: number) => (
                                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px', fontSize: '10px', color: '#475569', lineHeight: '1.4' }}>
                                                    <span style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '9px', marginTop: '2px' }}>
                                                        {i + 1}
                                                    </span>
                                                    <span>مراجعة هدف: <strong>{g.goalText}</strong></span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ fontSize: '10px', color: '#475569', lineHeight: '1.4', textAlign: 'center', margin: 0 }}>
                                            أداء رائع، لا يوجد تدخل مطلوب حالياً.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
SummaryPrintTemplate.displayName = "SummaryPrintTemplate";
