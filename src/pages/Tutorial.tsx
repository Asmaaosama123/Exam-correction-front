import { MainLayout } from "@/components/layout/MainLayout";
import { Play, Info, CheckCircle2, Lightbulb, Video, Loader2 } from "lucide-react";
import { useTutorials } from "@/hooks/use-tutorials";
import { API_BASE_URL } from "@/lib/api";

export default function Tutorial() {
    const { data: tutorials, isLoading } = useTutorials();

    return (
        <MainLayout>
            <div className="flex flex-1 flex-col gap-8 p-6 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                        فيديوهات توضيحية للمنصة
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        تعرف على كيفية استخدام تقنيات الذكاء الاصطناعي في تصحيح أوراق الاختبارات وتوفير الوقت والجهد.
                    </p>
                </div>

                {/* Loading State or Video List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">جاري تحميل الفيديوهات...</p>
                    </div>
                ) : !tutorials || tutorials.length === 0 ? (
                    <div className="bg-card border-2 border-dashed rounded-3xl p-20 text-center space-y-4">
                        <div className="bg-primary/5 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                            <Video className="h-10 w-10 text-primary/40" />
                        </div>
                        <h3 className="text-xl font-bold">لا يوجد فيديوهات تعليمية حالياً</h3>
                        <p className="text-muted-foreground">سيتم إضافة فيديوهات توضيحية قريباً من قبل الإدارة.</p>
                    </div>
                ) : (
                    <div className="grid gap-12">
                        {tutorials.map((video) => (
                            <div key={video.id} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-lg">
                                        <Play className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-bold">{video.title}</h2>
                                </div>
                                {video.description && (
                                    <p className="text-muted-foreground pr-10">{video.description}</p>
                                )}
                                <div className="relative group rounded-3xl overflow-hidden shadow-2xl border-4 border-background bg-black aspect-video">
                                    <video
                                        controls
                                        preload="auto"
                                        playsInline
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-contain"
                                        poster="/logo-no-bg.png"
                                    >
                                        <source 
                                            src={`${API_BASE_URL.replace(/\/$/, "")}/${video.videoPath.startsWith("/") ? video.videoPath.substring(1) : video.videoPath}`} 
                                            type="video/mp4" 
                                        />
                                        Your browser does not support the video tag.
                                    </video>
                                    <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-3xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Tips / Instructions */}
                <div className="grid gap-6 md:grid-cols-2 mt-4">
                    <div className="bg-card rounded-2xl p-6 border shadow-sm flex gap-4 transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Info className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">شرح الخطوات</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                يستعرض الفيديو دورة العمل كاملة بدءاً من رفع أوراق الطلاب وحتى استخراج النتائج النهائية بدقة عالية.
                            </p>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl p-6 border shadow-sm flex gap-4 transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Lightbulb className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">نصائح هامة</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                تأكد من وضوح الصورة وتوفر الإضاءة الجيدة لضمان أعلى مستويات الدقة في التعرف على الإجابات.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Features Highlights */}
                <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 mt-4">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold italic">ماذا ستتعلم في هذه الفيديوهات؟</h2>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-4">
                        {[
                            "كيفية رفع أوراق إجابات متعددة (PDF أو صور)",
                            "طريقة استخدام الكاميرا للتصحيح المباشر",
                            "مراجعة النتائج وتدقيق الأسئلة",
                            "تصدير التقارير بصيغة PDF و Excel"
                        ].map((text, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                <span className="text-foreground/80">{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
}
