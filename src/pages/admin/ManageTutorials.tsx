import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useTutorials, useCreateTutorial, useDeleteTutorial } from "@/hooks/use-tutorials";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Video, Loader2, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { API_BASE_URL } from "@/lib/api";

export default function ManageTutorials() {
    const { data: tutorials } = useTutorials();
    const { mutate: deleteTutorial } = useDeleteTutorial();
    const { mutate: createTutorial, isPending: isUploading } = useCreateTutorial();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [previewVideo, setPreviewVideo] = useState<{url: string, title: string} | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleAddVideo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        const formData = new FormData();
        formData.append("Title", title);
        formData.append("Description", description);
        formData.append("File", file);

        createTutorial(formData, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setTitle("");
                setDescription("");
                setFile(null);
            }
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">إدارة الفيديوهات التعليمية</h1>
                        <p className="text-muted-foreground mt-2">
                            رفع فيديوهات توضيحية للمعلمين لمساعدتهم في استخدام المنصة.
                        </p>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="flex gap-2">
                        <PlusCircle className="h-4 w-4" />
                        إضافة فيديو جديد
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {!tutorials || tutorials.length === 0 ? (
                        <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-slate-50/50">
                            <div className="rounded-full bg-slate-100 p-4">
                                <Video className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">لا توجد فيديوهات مرفوعة حالياً</h3>
                            <p className="mt-2 text-sm text-slate-500">سيتم عرض الفيديوهات التوضيحية عند رفعها من قبل الإدارة.</p>
                        </div>
                    ) : (
                        tutorials.map((video) => (
                            <Card key={video.id} className="group relative flex flex-col overflow-hidden border-slate-200 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                                <div className="absolute top-0 right-0 h-1.5 w-full bg-slate-100 group-hover:bg-primary/20 transition-colors" />
                                
                                <CardHeader className="p-5 pb-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary group-hover:bg-primary/20 transition-colors">
                                                <Video className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="font-bold text-slate-900 leading-none mb-1">
                                                    {video.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
    
                                <CardContent className="flex-1 p-5 space-y-4">
                                    <div className="min-h-[60px]">
                                        <p className="text-sm leading-relaxed text-slate-600">
                                            {video.description || "لا يوجد وصف متوفر لهذا الفيديو."}
                                        </p>
                                    </div>
    
                                    <Separator className="bg-slate-100/50" />
    
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-xs font-medium">
                                                {format(new Date(video.createdAt), "d MMMM yyyy", { locale: ar })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-bold border-primary/20 text-primary hover:bg-primary/5"
                                                onClick={() => {
                                                    const baseUrl = API_BASE_URL.replace(/\/$/, "");
                                                    const path = video.videoPath.startsWith("/") ? video.videoPath : "/" + video.videoPath;
                                                    setPreviewVideo({
                                                        url: `${baseUrl}${path}`,
                                                        title: video.title
                                                    });
                                                }}
                                            >
                                                <Eye className="h-4 w-4 ml-2" />
                                                عرض
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm("هل أنت متأكد من حذف هذا الفيديو؟")) {
                                                        deleteTutorial(video.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none" dir="rtl">
                    <DialogHeader className="p-4 bg-background text-right">
                        <DialogTitle>{previewVideo?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video w-full bg-black flex items-center justify-center">
                        {previewVideo && (
                            <video 
                                src={previewVideo.url} 
                                controls 
                                autoPlay 
                                playsInline
                                crossOrigin="anonymous"
                                className="w-full h-full"
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-right">إضافة فيديو تعليمي</DialogTitle>
                        <DialogDescription className="text-right">
                            اختر ملف الفيديو وأدخل العنوان لبدء الرفع.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddVideo} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">عنوان الفيديو</Label>
                            <Input
                                id="title"
                                placeholder="مثال: شرح طريقة تصحيح الاختبارات"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">وصف قصير (اختياري)</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="video">ملف الفيديو</Label>
                            <Input
                                id="video"
                                type="file"
                                accept="video/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required
                                className="cursor-pointer"
                            />
                            {file && <p className="text-xs text-muted-foreground">الحجم: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
                        </div>

                        {isUploading && (
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>جاري الرفع...</span>
                                </div>
                                <Progress value={undefined} className="h-2 animate-pulse" />
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 sm:flex-row-reverse mt-6">
                            <Button type="submit" disabled={isUploading || !file || !title}>
                                {isUploading ? (
                                    <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                        جاري الرفع...
                                    </>
                                ) : "بدء الرفع"}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>
                                إلغاء
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
