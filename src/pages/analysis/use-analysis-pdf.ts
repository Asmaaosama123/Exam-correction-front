import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { examsApi } from "@/lib/exams-api";
import type { Exam } from "./types";

export function useAnalysisPdf() {
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

    const radarChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);
    const strengthRadarChartRef = useRef<HTMLDivElement>(null);
    const weaknessRadarChartRef = useRef<HTMLDivElement>(null);
    const classStrengthRadarChartRef = useRef<HTMLDivElement>(null);
    const classWeaknessRadarChartRef = useRef<HTMLDivElement>(null);
    const classQuestionBarChartRef = useRef<HTMLDivElement>(null);

    const studentRadarCaptureRef = useRef<HTMLDivElement>(null);
    const studentStrengthRadarCaptureRef = useRef<HTMLDivElement>(null);
    const studentWeaknessRadarCaptureRef = useRef<HTMLDivElement>(null);

    const captureChart = async (targetRef: React.RefObject<HTMLDivElement>): Promise<string | null> => {
        if (!targetRef.current) return null;
        try {
            const canvas = await html2canvas(targetRef.current, {
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
            console.error("Error capturing chart:", error);
            return null;
        }
    };

    const handleDownloadPDF = async ({
        selectedExamId,
        selectedPaperId,
        selectedClassId,
        classIdValue,
        activeTab,
        selectedExam
    }: {
        selectedExamId: string;
        selectedPaperId: string;
        selectedClassId?: string;
        classIdValue?: number;
        activeTab: string;
        selectedExam?: Exam;
    }) => {
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

            // Optional explicit delay for class chart rendering
            if (classQuestionBarChartRef.current) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (barChartRef.current) barImg = await captureChart(barChartRef);
            if (classStrengthRadarChartRef.current) csRadarImg = await captureChart(classStrengthRadarChartRef);
            if (classWeaknessRadarChartRef.current) cwRadarImg = await captureChart(classWeaknessRadarChartRef);
            if (classQuestionBarChartRef.current) cqBarImg = await captureChart(classQuestionBarChartRef);

            if (selectedPaperId) {
                if (studentRadarCaptureRef.current || radarChartRef.current) {
                    radarImg = await captureChart(studentRadarCaptureRef.current ? studentRadarCaptureRef : radarChartRef);
                }
                if (studentStrengthRadarCaptureRef.current || strengthRadarChartRef.current) {
                    sRadarImg = await captureChart(studentStrengthRadarCaptureRef.current ? studentStrengthRadarCaptureRef : strengthRadarChartRef);
                }
                if (studentWeaknessRadarCaptureRef.current || weaknessRadarChartRef.current) {
                    wRadarImg = await captureChart(studentWeaknessRadarCaptureRef.current ? studentWeaknessRadarCaptureRef : weaknessRadarChartRef);
                }
            }

            const { blob, filename } = await examsApi.downloadDetailedAnalysisPdf({
                examId: parseInt(selectedExamId),
                paperId: activeTab === "students" && selectedPaperId ? parseInt(selectedPaperId) : undefined,
                classId: selectedClassId && selectedClassId !== "all" ? classIdValue : undefined,
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

    return {
        isDownloadingPDF,
        handleDownloadPDF,
        refs: {
            radarChartRef,
            barChartRef,
            strengthRadarChartRef,
            weaknessRadarChartRef,
            classStrengthRadarChartRef,
            classWeaknessRadarChartRef,
            classQuestionBarChartRef,
            studentRadarCaptureRef,
            studentStrengthRadarCaptureRef,
            studentWeaknessRadarCaptureRef
        }
    };
}
