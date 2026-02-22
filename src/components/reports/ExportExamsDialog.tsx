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
    const [isExporting, setIsExporting] = useState(false);
    const { data: examsData, isLoading: isLoadingExams } = useGetExams();

    useEffect(() => {
        if (!open) {
            setSelectedExamId("");
            setIsExporting(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!selectedExamId) return;

        setIsExporting(true);
        try {
            const response = await api.get(`/api/Reports/report-exam-results-excel?examId=${selectedExamId}`, {
                responseType: "blob",
            });

            const contentDisposition = response.headers["content-disposition"];
            let filename = "درجات_الاختبار.xlsx";
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ""));
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
        } catch (error) {
            console.error("Export failed", error);
            toast.error("فشل تصدير الدرجات. يرجى المحاولة مرة أخرى.");
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
                        اختر الاختبار الذي تريد تصدير درجات طلابه بصيغة Excel
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
                        <div className="flex flex-col items-center gap-2 rounded-lg border-2 p-4 border-primary bg-accent">
                            <FileSpreadsheet className="h-6 w-6 text-primary" />
                            <span className="text-sm font-medium">Excel</span>
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
                                تصدير
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
