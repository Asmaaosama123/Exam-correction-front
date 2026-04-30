import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    FileDown, 
    Loader2, 
    Search, 
    Eye, 
    FileArchive, 
    Calendar, 
    FileCheck,
    X
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TeacherExamSummary {
    examId: number;
    title: string;
    subject: string;
    paperCount: number;
    lastCorrectedAt: string;
}

interface TeacherDownloadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacherId: string;
    teacherName: string;
}

export function TeacherDownloadModal({
    open,
    onOpenChange,
    teacherId,
    teacherName,
}: TeacherDownloadModalProps) {
    const [exams, setExams] = useState<TeacherExamSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedExams, setSelectedExams] = useState<Set<number>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewingExamId, setPreviewingExamId] = useState<number | null>(null);

    useEffect(() => {
        if (open && teacherId) {
            fetchTeacherExams();
            setSelectedExams(new Set());
        }
    }, [open, teacherId]);

    const fetchTeacherExams = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/Admin/users/${teacherId}/exams`);
            setExams(response.data);
        } catch (error) {
            console.error("Failed to fetch teacher exams:", error);
            toast.error("فشل في تحميل تاريخ امتحانات المعلم");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExam = (id: number) => {
        const next = new Set(selectedExams);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedExams(next);
    };

    const toggleAll = () => {
        if (selectedExams.size === filteredExams.length) {
            setSelectedExams(new Set());
        } else {
            setSelectedExams(new Set(filteredExams.map(e => e.examId)));
        }
    };

    const handleDownloadZip = async () => {
        if (selectedExams.size === 0) return;

        try {
            setIsDownloading(true);
            const examIds = Array.from(selectedExams);
            const queryParams = examIds.map(id => `examIds=${id}`).join("&");
            const response = await api.get(`/api/Reports/export-corrected-papers-zip?${queryParams}&teacherId=${teacherId}`, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/zip" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Corrected_Papers_${teacherName}_${format(new Date(), "yyyyMMdd")}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("تم بدء تحميل ملف ZIP بنجاح");
        } catch (error) {
            console.error("ZIP download error:", error);
            toast.error("فشل في تحميل ملف ZIP");
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePreview = async (examId: number) => {
        try {
            setPreviewingExamId(examId);
            const response = await api.get(`/api/Reports/export-corrected-papers-pdf?examId=${examId}&teacherId=${teacherId}`, {
                responseType: "blob",
            });
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (error) {
            console.error("Preview error:", error);
            toast.error("فشل في تحميل المعاينة");
            setPreviewingExamId(null);
        }
    };

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewingExamId(null);
    };

    const filteredExams = exams.filter(e => 
        (e.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (e.subject?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-5xl md:max-w-6xl h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-bottom bg-muted/30">
                    <DialogTitle className="text-right text-2xl font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <FileArchive className="h-6 w-6 text-primary" />
                            تاريخ امتحانات المعلم: {teacherName}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-right mt-1">
                        استعرض وحمل كافة الامتحانات التي قام المعلم بتصحيحها. يمكنك اختيار عدة امتحانات لتحميلها كملف ZIP.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* Toolbar */}
                    <div className="p-4 bg-card border-b flex flex-wrap gap-4 items-center justify-between" dir="rtl">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="ابحث في الامتحانات أو المواد..." 
                                className="pr-9 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={toggleAll}
                                disabled={filteredExams.length === 0}
                                className="h-10"
                            >
                                {selectedExams.size === filteredExams.length && filteredExams.length > 0 ? "إلغاء الكل" : "تحديد الكل"}
                            </Button>
                            <Button
                                onClick={handleDownloadZip}
                                disabled={selectedExams.size === 0 || isDownloading}
                                className="h-10 gap-2 bg-primary hover:bg-primary/90"
                            >
                                {isDownloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileArchive className="h-4 w-4" />
                                )}
                                تحميل المختار ({selectedExams.size}) كـ ZIP
                            </Button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto bg-white" dir="rtl">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-muted-foreground animate-pulse">جاري تحميل البيانات...</p>
                            </div>
                        ) : filteredExams.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                                <Search className="h-12 w-12 opacity-20" />
                                <p>{searchQuery ? "لا توجد نتائج بحث مطابقة" : "لا توجد امتحانات مصححة متاحة لهذا المعلم"}</p>
                            </div>
                        ) : (
                            <div className="min-w-full inline-block align-middle">
                                <table className="min-w-full divide-y divide-border border-collapse">
                                    <thead className="bg-muted/80 sticky top-0 z-20 backdrop-blur-sm shadow-sm">
                                        <tr>
                                            <th className="px-6 py-4 text-right w-12">
                                                <Checkbox 
                                                    checked={selectedExams.size === filteredExams.length && filteredExams.length > 0}
                                                    onCheckedChange={toggleAll}
                                                />
                                            </th>
                                            <th className="px-3 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">الامتحان والمادة</th>
                                            <th className="px-3 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">عدد الأوراق</th>
                                            <th className="px-3 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">تاريخ التصحيح</th>
                                            <th className="px-3 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-border">
                                        {filteredExams.map((exam) => (
                                            <tr key={exam.examId} className="hover:bg-primary/5 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Checkbox 
                                                        checked={selectedExams.has(exam.examId)}
                                                        onCheckedChange={() => toggleExam(exam.examId)}
                                                    />
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{exam.title}</span>
                                                        <span className="text-xs text-muted-foreground font-medium">{exam.subject}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                                    <Badge variant="secondary" className="gap-1 font-mono font-bold bg-secondary/50 text-secondary-foreground">
                                                        <FileCheck className="h-3 w-3" />
                                                        {exam.paperCount}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(exam.lastCorrectedAt), "dd/MM/yyyy")}
                                                        </span>
                                                        <span className="opacity-70">{format(new Date(exam.lastCorrectedAt), "HH:mm")}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-none"
                                                            onClick={() => handlePreview(exam.examId)}
                                                            disabled={previewingExamId === exam.examId}
                                                            title="معاينة"
                                                        >
                                                            {previewingExamId === exam.examId ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Eye className="h-5 w-5" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-none"
                                                            title="تحميل PDF"
                                                            onClick={async () => {
                                                                try {
                                                                    const response = await api.get(`/api/Reports/export-corrected-papers-pdf?examId=${exam.examId}&teacherId=${teacherId}`, {
                                                                        responseType: "blob",
                                                                    });
                                                                    const blob = new Blob([response.data], { type: "application/pdf" });
                                                                    const url = window.URL.createObjectURL(blob);
                                                                    const link = document.createElement("a");
                                                                    link.href = url;
                                                                    link.download = `${exam.title}_${teacherName}_Corrected.pdf`;
                                                                    link.click();
                                                                    window.URL.revokeObjectURL(url);
                                                                } catch (err) { toast.error("فشل تحميل PDF"); }
                                                            }}
                                                        >
                                                            <FileDown className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* PDF Preview Overlay */}
                {previewUrl && (
                    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col">
                        <div className="flex justify-between items-center p-4 bg-black/50 text-white">
                            <span className="font-semibold">معاينة الأوراق المصححة</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-white hover:bg-white/20 rounded-full" 
                                onClick={closePreview}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        <iframe 
                            src={`${previewUrl}#view=FitH`} 
                            className="flex-1 w-full border-none bg-white" 
                            title="Corrected Papers Preview" 
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
