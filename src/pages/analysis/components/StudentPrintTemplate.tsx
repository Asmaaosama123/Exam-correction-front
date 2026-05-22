import React, { forwardRef, useMemo } from "react";
import { Radar } from 'react-chartjs-2';
import { getHijriYearOnly, getSemesterName } from "../utils";
import { Award, AlertCircle, Lightbulb, CheckSquare, AlertTriangle } from "lucide-react";

interface StudentPrintTemplateProps {
    studentReport: any;
    selectedExam: any;
    examPaper: any;
    radarData: any;
}

export const StudentPrintTemplate = forwardRef<HTMLDivElement, StudentPrintTemplateProps>(({
    studentReport,
    selectedExam,
    examPaper,
    radarData
}, ref) => {

    if (!studentReport || !examPaper) return <div ref={ref} className="hidden" />;

    const currentDate = new Date().toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' });

    return (
        <div ref={ref} className="bg-white text-black print-pdf-template" dir="rtl" style={{ width: '100%', fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
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
                    .page-break {
                        page-break-before: always;
                    }
                    .avoid-break {
                        page-break-inside: avoid;
                    }
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
                    /* Ensures radar canvas doesn't stretch and break layout */
                    .radar-box canvas {
                        max-height: 400px !important;
                        width: 100% !important;
                        object-fit: contain;
                    }
                }
            `}</style>

            {/* Repeating Footer */}
            <div className="print-footer hidden print:flex z-50">
                <span>وسيلة | مسار الطالب التحليلي</span>
                <span>تاريخ التقرير: {currentDate}</span>
            </div>

            <div style={{ background: '#fff', padding: '10px 20px', width: '100%', border: 'none' }}>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '12px', marginBottom: '20px' }}>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>التقرير التحليلي الفردي والطالب</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>تقرير الأداء وتفصيل الإجابات والتوصيات</div>
                    </div>
                </div>

                {/* Horizontal Info Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {[
                        { label: 'اسم الطالب', value: examPaper.studentName, color: '#3b82f6' },
                        { label: 'الفصل', value: examPaper.className },
                        { label: 'المادة', value: selectedExam?.subject },
                        { label: 'النتيجة', value: `${examPaper.finalScore} / ${examPaper.totalQuestions} (${(studentReport.percentage ?? 0).toFixed(0)}%)`, color: (studentReport.percentage ?? 0) >= 50 ? '#10b981' : '#f43f5e' }
                    ].map((info, idx) => (
                        <div key={idx} style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '12px', textAlign: 'center', backgroundColor: '#fcfcfc' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{info.label}</div>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: info.color || '#0f172a' }}>{info.value}</div>
                        </div>
                    ))}
                </div>

                {/* Overall Performance Chart */}
                <div className="avoid-break" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>الأداء العام للطالب مقابل متوسط الفصل</h3>
                        <p style={{ fontSize: '11px', color: '#64748b' }}>شكل يوضح مدى إلمام الطالب بأهداف التعلم المختلفة</p>
                    </div>
                    <div className="radar-box" style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center' }}>
                        <Radar data={radarData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </div>

                {/* Strengths and Weaknesses Grid */}
                <div className="avoid-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    {/* Strengths */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', borderTop: '4px solid #10b981', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={16} color="#10b981" />
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>نقاط القوة (فوق 50%)</h3>
                        </div>
                        <div style={{ padding: '14px' }}>
                            {studentReport.goalAnalysis.filter((g: any) => g.successRate >= 50).length > 0 ? (
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                    {studentReport.goalAnalysis.filter((g: any) => g.successRate >= 50).slice(0, 8).map((g: any, i: number) => (
                                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px dashed #e2e8f0' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{g.goalText}</span>
                                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '900' }}>{g.successRate.toFixed(0)}%</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>لا توجد نقاط قوة بارزة</div>
                            )}
                        </div>
                    </div>

                    {/* Weaknesses */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', borderTop: '4px solid #f43f5e', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} color="#f43f5e" />
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>نقاط الضعف (أقل من 50%)</h3>
                        </div>
                        <div style={{ padding: '14px' }}>
                            {studentReport.goalAnalysis.filter((g: any) => g.successRate < 50).length > 0 ? (
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                    {studentReport.goalAnalysis.filter((g: any) => g.successRate < 50).slice(0, 8).map((g: any, i: number) => (
                                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px dashed #e2e8f0' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{g.goalText}</span>
                                            <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: '900' }}>{g.successRate.toFixed(0)}%</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>أداء ممتاز، لا توجد نقاط ضعف.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Recommendations */}
                {studentReport.goalAnalysis && studentReport.goalAnalysis.length > 0 && (
                    <div className="avoid-break" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', borderRight: '4px solid #6366f1', padding: '16px', marginBottom: '24px', backgroundColor: '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Lightbulb size={20} color="#6366f1" />
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>التوصيات المقترحة</h3>
                        </div>
                        <div>
                            {studentReport.goalAnalysis.filter((g: any) => g.successRate < 50).length > 0 ? (
                                <p style={{ fontSize: '13px', lineHeight: '1.8' }}>
                                    يجب التركيز الفوري على مراجعة الأهداف التالية لكونها تمثل تحديات واضحة للطالب:
                                    <strong style={{ color: '#be123c', marginRight: '6px' }}>
                                        {studentReport.goalAnalysis.filter((g: any) => g.successRate < 50).map((g: any) => '"' + g.goalText + '"').join('، و ')}
                                    </strong>
                                </p>
                            ) : (
                                <p style={{ fontSize: '13px', lineHeight: '1.8', color: '#047857' }}>
                                    أداء استثنائي ومتقن! الطالب أظهر إتقاناً لجميع الأهداف الأساسية. يُنصح بالحفاظ على هذا المستوى الرائع والبدء في تحديات أعلى.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Detailed Answers Section (May break to new page) */}
                {studentReport.answers && studentReport.answers.length > 0 && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>سجل تفاصيل إجابات الطالب</h3>
                        </div>
                        <table style={{ width: '100%', textIndent: 0, borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>رقم السؤال</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#475569', borderRight: '1px solid #e2e8f0' }}>إجابة الطالب</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#475569', borderRight: '1px solid #e2e8f0' }}>الإجابة الصحيحة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#475569', borderRight: '1px solid #e2e8f0' }}>التقييم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentReport.answers.map((answer: any, index: number) => {
                                    const formatAnswer = (ans: string) => {
                                        if (!ans) return '-';
                                        const upperAns = ans.toString().toUpperCase();
                                        if (upperAns === 'TRUE') return 'صح';
                                        if (upperAns === 'FALSE') return 'خطأ';
                                        return ans;
                                    };
                                    const questionNum = answer.id || (index + 1);

                                    return (
                                        <tr key={questionNum} className="avoid-break" style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                                                {questionNum}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: answer.ok ? '#10b981' : '#f43f5e', borderRight: '1px solid #e2e8f0', textDecoration: answer.ok ? 'none' : 'line-through' }}>
                                                {formatAnswer(answer.pred)}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                                                {formatAnswer(answer.gt)}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                                                {answer.ok ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>
                                                        <CheckSquare size={14} /> صحيحة
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '12px', fontWeight: 'bold' }}>
                                                        <AlertTriangle size={14} /> خاطئة
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
});
StudentPrintTemplate.displayName = "StudentPrintTemplate";
