import { useState, useEffect } from "react";
import { Download, Loader2, FileText, Image as ImageIcon } from "lucide-react";
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
import { useGetClasses } from "@/hooks/use-classes";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ExportCorrectedPapersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportCorrectedPapersDialog({
    open,
    onOpenChange,
}: ExportCorrectedPapersDialogProps) {
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [isExporting, setIsExporting] = useState(false);
    
    const { data: examsData, isLoading: isLoadingExams } = useGetExams();
    const { data: classesData, isLoading: isLoadingClasses } = useGetClasses();

    useEffect(() => {
        if (!open) {
            setSelectedExamId("");
            setSelectedClassId("all");
            setIsExporting(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!selectedExamId) return;

        setIsExporting(true);
        try {
            let urlPath = `/api/Reports/export-corrected-papers-pdf?examId=${selectedExamId}`;
            
            if (selectedClassId && selectedClassId !== "all") {
                urlPath += `&classId=${selectedClassId}`;
            }

            const response = await api.get(urlPath, {
                responseType: "blob",
            });

            const contentDisposition = response.headers["content-disposition"] || response.headers["Content-Disposition"];

            // Default filename fallback
            const selectedExam = examsData?.find(e => e.id.toString() === selectedExamId);
            const cleanTitle = selectedExam?.title?.replace(/[\\/:*?"<>|]/g, "_") || "الأوراق_المصححة";
            
            let classNameSuffix = "";
            if (selectedClassId && selectedClassId !== "all") {
                const selectedClass = classesData?.find(c => c.id.toString() === selectedClassId);
                if (selectedClass) {
                    classNameSuffix = `_${selectedClass.name.replace(/[\\/:*?"<>|]/g, "_")}`;
                }
            }

            let filename = `${cleanTitle}${classNameSuffix}_المصححة.pdf`;

            if (contentDisposition) {
                const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/i);
                if (filenameStarMatch && filenameStarMatch[1]) {
                    filename = decodeURIComponent(filenameStarMatch[1]);
                } else {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ""));
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

            toast.success("تم تحميل الأوراق بنجاح");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Export failed", error);
            let errorMessage = "لا توجد أوراق مصححة لهذا الاختبار.";

            if (error.response?.data instanceof Blob && error.response.data.type === "application/json") {
                try {
                    const text = await error.response.data.text();
                    const jsonError = JSON.parse(text);
                    if (jsonError.errors && jsonError.errors[0]?.Description) {
                        errorMessage = jsonError.errors[0].Description;
                    } else if (jsonError.description) {
                        errorMessage = jsonError.description;
                    }
                } catch (e) {}
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
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        تحميل الأوراق المصححة (PDF)
                    </DialogTitle>
                    <DialogDescription>
                        سيتم تجميع كافة أوراق الطلاب المصححة في ملف PDF واحد ليسهل طباعتها أو مراجعتها.
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
                        <Label>اختر الفصل (اختياري)</Label>
                        <Select
                            value={selectedClassId}
                            onValueChange={setSelectedClassId}
                            disabled={isLoadingClasses || isExporting}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="كل الفصول" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الفصول</SelectItem>
                                {isLoadingClasses ? (
                                    <SelectItem value="loading" disabled>
                                        جاري التحميل...
                                    </SelectItem>
                                ) : (
                                    classesData?.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
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
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                جاري التجميع...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 ml-2" />
                                تحميل الملف (PDF)
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
