import { useState, useEffect } from "react";
import { Download, Loader2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGetExams } from "@/hooks/use-exams";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ExportExamsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportExamsDialog({
    open,
    onOpenChange,
}: ExportExamsDialogProps) {
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [format, setFormat] = useState<"excel" | "pdf">("excel");
    const [isExporting, setIsExporting] = useState(false);
    const { data: examsData, isLoading: isLoadingExams } = useGetExams();

    useEffect(() => {
        if (!open) {
            setSelectedExamId("");
            setFormat("excel");
            setIsExporting(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!selectedExamId) return;

        setIsExporting(true);
        try {
            const endpoint = format === "excel" ? "report-exam-results-excel" : "report-exam-results-pdf";
            const response = await api.get(`/api/Reports/${endpoint}?examId=${selectedExamId}`, {
                responseType: "blob",
            });

            const contentDisposition = response.headers["content-disposition"] || response.headers["Content-Disposition"];

            // Default filename fallback using exam title if possible
            const selectedExam = examsData?.find(e => e.id.toString() === selectedExamId);
            const cleanTitle = selectedExam?.title?.replace(/[\\/:*?"<>|]/g, "_") || "درجات_الاختبار";
            let filename = format === "excel" ? `${cleanTitle}.xlsx` : `${cleanTitle}.pdf`;

            if (contentDisposition) {
                // Try to extract filename from content-disposition
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ""));
                } else {
                    // Try filename* (UTF-8)
                    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/i);
                    if (filenameStarMatch && filenameStarMatch[1]) {
                        filename = decodeURIComponent(filenameStarMatch[1]);
                    }
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // Track download
            const downloads = localStorage.getItem("downloads");
            const title = "تقارير الاختبارات";
            if (downloads) {
                const downloadsObj = JSON.parse(downloads);
                downloadsObj[title] = (downloadsObj[title] || 0) + 1;
                localStorage.setItem("downloads", JSON.stringify(downloadsObj));
            } else {
                localStorage.setItem("downloads", JSON.stringify({ [title]: 1 }));
            }

            toast.success("تم تصدير الدرجات بنجاح");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Export failed", error);

            let errorMessage = "فشل تصدير الدرجات. يرجى المحاولة مرة أخرى.";

            // Try to parse the error from the blob if it's JSON
            if (error.response?.data instanceof Blob && error.response.data.type === "application/json") {
                try {
                    const text = await error.response.data.text();
                    const jsonError = JSON.parse(text);
                    if (jsonError.errors && jsonError.errors[0]?.Description) {
                        errorMessage = jsonError.errors[0].Description;
                    } else if (jsonError.description) {
                        errorMessage = jsonError.description;
                    }
                } catch (e) {
                    // Ignore parsing error
                }
            } else if (error.response?.data?.errors?.[0]?.Description) {
                errorMessage = error.response.data.errors[0].Description;
            }

            toast.error(errorMessage);
        } finally {
            setIsExporting(false);
        }
    };

    const canSubmit = selectedExamId !== "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>تصدير درجات الاختبار</DialogTitle>
                    <DialogDescription>
                        اختر الاختبار الذي تريد تصدير درجات طلابه بصيغة Excel أو PDF
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label>اختر الاختبار</Label>
                        <Select
                            value={selectedExamId}
                            onValueChange={setSelectedExamId}
                            disabled={isLoadingExams || isExporting}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="اختر الاختبار من القائمة" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingExams ? (
                                    <SelectItem value="loading" disabled>
                                        جاري التحميل...
                                    </SelectItem>
                                ) : (
                                    examsData?.map((exam) => (
                                        <SelectItem key={exam.id} value={exam.id.toString()}>
                                            {exam.title} - {exam.subject}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>صيغة التصدير</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormat("excel")}
                                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${format === "excel"
                                    ? "border-primary bg-accent"
                                    : "border-muted bg-transparent hover:border-muted-foreground/50"
                                    }`}
                            >
                                <FileSpreadsheet className={`h-6 w-6 ${format === "excel" ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`text-sm font-medium ${format === "excel" ? "text-primary" : "text-muted-foreground"}`}>Excel</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormat("pdf")}
                                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${format === "pdf"
                                    ? "border-primary bg-accent"
                                    : "border-muted bg-transparent hover:border-muted-foreground/50"
                                    }`}
                            >
                                <FileText className={`h-6 w-6 ${format === "pdf" ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`text-sm font-medium ${format === "pdf" ? "text-primary" : "text-muted-foreground"}`}>PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isExporting}
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || isExporting}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                جاري التصدير...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 ml-2" />
                                تصدير {format.toUpperCase()}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
