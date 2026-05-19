import { useState, useEffect } from "react";
import { Download, Loader2, Users, User } from "lucide-react";
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
import { useGetStudents } from "@/hooks/use-students";
import { useGetClasses } from "@/hooks/use-classes";
import { examsApi } from "@/lib/exams-api";
import { toast } from "sonner";

interface ExportStudentProgressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportStudentProgressDialog({
    open,
    onOpenChange,
}: ExportStudentProgressDialogProps) {
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
    const [isExporting, setIsExporting] = useState(false);
    
    // Fetch classes
    const { data: classesData, isLoading: isLoadingClasses } = useGetClasses();

    // Fetch students list (filtered by class)
    const { data: studentsData, isLoading: isLoadingStudents } = useGetStudents({
        pageNumber: 1,
        pageSize: 1000,
        classId: selectedClassId === "all" ? undefined : selectedClassId
    });

    useEffect(() => {
        if (!open) {
            setSelectedClassId("all");
            setSelectedStudentId("all");
            setIsExporting(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        setIsExporting(true);
        const toastId = toast.loading(selectedStudentId === "all" ? "جاري تحضير التقرير التراكمي لجميع الطلاب..." : "جاري تحضير تقرير الطالب...");

        try {
            const { blob, filename } = await examsApi.downloadStudentProgressPdf({
                studentId: selectedStudentId === "all" ? undefined : parseInt(selectedStudentId),
                classId: selectedClassId === "all" ? undefined : parseInt(selectedClassId)
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename || "تقرير_التطور.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // Track download
            const downloads = localStorage.getItem("downloads");
            const title = "تقرير الطالب التراكمي";
            if (downloads) {
                const downloadsObj = JSON.parse(downloads);
                downloadsObj[title] = (downloadsObj[title] || 0) + 1;
                localStorage.setItem("downloads", JSON.stringify(downloadsObj));
            } else {
                localStorage.setItem("downloads", JSON.stringify({ [title]: 1 }));
            }

            toast.success("تم تحميل التقرير بنجاح", { id: toastId });
            onOpenChange(false);
        } catch (error: any) {
            console.error("Export failed", error);
            toast.error("فشل تحميل التقرير. يرجى المحاولة مرة أخرى.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        تحميل التقرير التراكمي
                    </DialogTitle>
                    <DialogDescription>
                        اختر الطالب الذي تريد تحميل تقرير تطوره في جميع الاختبارات، أو اختر "جميع الطلاب" لتحميل تقرير شامل.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label>الفصل</Label>
                        <Select
                            value={selectedClassId}
                            onValueChange={(val) => {
                                setSelectedClassId(val);
                                setSelectedStudentId("all");
                            }}
                            disabled={isLoadingClasses || isExporting}
                        >
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="اختر الفصل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="font-bold text-primary">جميع الفصول</SelectItem>
                                {classesData?.map((cls: any) => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>اختر الطالب</Label>
                        <Select
                            value={selectedStudentId}
                            onValueChange={setSelectedStudentId}
                            disabled={isLoadingStudents || isExporting}
                        >
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="اختر الطالب من القائمة" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingStudents ? (
                                    <SelectItem value="loading" disabled>
                                        جاري التحميل...
                                    </SelectItem>
                                ) : (
                                    <>
                                        <SelectItem value="all" className="font-bold text-primary">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                جميع طلاب {selectedClassId === "all" ? "الفصول" : "الفصل"}
                                            </div>
                                        </SelectItem>
                                        {studentsData?.items?.map((student: any) => (
                                            <SelectItem key={student.id} value={student.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 opacity-50" />
                                                    {student.fullName}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-start gap-3">
                        <div className="mt-0.5">
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            {selectedStudentId === "all" 
                                ? "سيتم تحميل ملف PDF يحتوي على ملخص أداء لجميع الطلاب المسجلين بالإضافة إلى تقرير منفصل لكل طالب."
                                : "سيتم تحميل ملف PDF يحتوي على تحليل شامل لأداء الطالب المختار وتطوره في جميع الاختبارات السابقة."}
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
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                جاري التحضير...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 ml-2" />
                                تحميل التقرير
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
