import React from "react";
import { FileText, Printer, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Exam } from "../types";

interface AnalysisHeaderProps {
    selectedExamId: string;
    setSelectedExamId: (id: string) => void;
    setSelectedClassId: (id: string | undefined) => void;
    isLoadingExams: boolean;
    exams: Exam[] | undefined;
    handlePrint: () => void;
    handleDownloadPDF: () => void;
    isDownloadingPDF: boolean;
    stats?: any;
    displayClassName?: string;
    selectedExam?: Exam;
}

export const AnalysisHeader = ({
    selectedExamId,
    setSelectedExamId,
    setSelectedClassId,
    isLoadingExams,
    exams,
    handlePrint,
    handleDownloadPDF,
    isDownloadingPDF,
    stats,
    displayClassName,
    selectedExam
}: AnalysisHeaderProps) => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 print:hidden border-b border-slate-100" dir="rtl">
            <div className="text-right">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">تحليل نتائج الاختبارات</h1>
                <p className="text-slate-400 mt-2 text-base font-medium">
                    نظرة تعمق في أداء الطلاب والتحقق من تحقيق الأهداف التعليمية
                </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 print:hidden">
                {/* Exam Selector */}
                <div className="flex items-center gap-2 px-1 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <div className="flex items-center gap-2 bg-white rounded-full border-2 border-emerald-500/30 px-4 py-1 shadow-sm min-w-[240px] hover:border-emerald-500 transition-colors">
                        <Select value={selectedExamId} onValueChange={(val) => {
                            setSelectedExamId(val);
                            setSelectedClassId(undefined);
                        }}>
                            <SelectTrigger className="h-10 border-none shadow-none bg-transparent focus:ring-0 px-1 text-sm font-black text-slate-700">
                                <SelectValue placeholder="اختر الاختبار" />
                                <span className="sr-only">اختر الاختبار</span>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                {isLoadingExams ? (
                                    <div className="p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-500" /></div>
                                ) : (
                                    exams?.map((exam) => (
                                        <SelectItem key={exam.id} value={exam.id.toString()} className="rounded-xl focus:bg-emerald-50">
                                            {exam.title}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                    </div>
                </div>

                <Button 
                    onClick={handlePrint}
                    variant="outline" 
                    className="h-12 px-6 rounded-full border-slate-200 text-slate-600 font-black hover:bg-slate-50 gap-2 shadow-sm transition-all text-sm"
                >
                    <span className="order-2">طباعة</span>
                    <Printer className="h-4 w-4 order-1" />
                </Button>

                <Button 
                    onClick={handleDownloadPDF}
                    disabled={!selectedExamId || isDownloadingPDF}
                    className="h-12 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black gap-2 shadow-md shadow-emerald-200 transition-all text-sm disabled:opacity-50"
                >
                    {isDownloadingPDF ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            جاري التحضير...
                        </>
                    ) : (
                        <>
                            <span className="order-2">تحميل PDF</span>
                            <Download className="h-4 w-4 order-1" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
