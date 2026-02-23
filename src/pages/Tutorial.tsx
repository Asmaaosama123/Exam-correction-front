import { MainLayout } from "@/components/layout/MainLayout";
import { Play, Info, CheckCircle2, Lightbulb } from "lucide-react";
import tutorialVideo from "@/assets/test/شرح التصحيح بالذكاء الاصطاني  موقع وسيلة.mp4";

export default function Tutorial() {
    return (
        <MainLayout>
            <div className="flex flex-1 flex-col gap-8 p-6 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                        فيديو توضيحي للمنصة
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        تعرف على كيفية استخدام تقنيات الذكاء الاصطناعي في تصحيح أوراق الاختبارات وتوفير الوقت والجهد.
                    </p>
                </div>

                {/* Video Player Container */}
                <div className="relative group rounded-3xl overflow-hidden shadow-2xl border-4 border-background bg-black aspect-video">
                    <video
                        controls
                        className="w-full h-full object-contain"
                        src={tutorialVideo}
                        poster="/logo.png" // Fallback poster if needed
                    >
                        Your browser does not support the video tag.
                    </video>

                    {/* Subtle overlay for design */}
                    <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-3xl" />
                </div>

                {/* Quick Tips / Instructions */}
                <div className="grid gap-6 md:grid-cols-2 mt-4">
                    <div className="bg-card rounded-2xl p-6 border shadow-sm flex gap-4 transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Play className="h-6 w-6 text-primary" />
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
                        <Info className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold italic">ماذا ستتعلم في هذا الفيديو؟</h2>
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
