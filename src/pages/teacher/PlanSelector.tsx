import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { subscriptionApi } from "@/lib/subscriptionApi";
import type { SubscriptionPlan, SubscriptionRequest } from "@/lib/adminApi";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Shield, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api";

export default function PlanSelector() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [myRequests, setMyRequests] = useState<SubscriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);

    const { data: user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.isSubscriptionModeEnabled === false) {
            navigate("/dashboard");
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [plansData, requestsData] = await Promise.all([
                subscriptionApi.getPlans(),
                subscriptionApi.getMyRequests()
            ]);
            setPlans(plansData);
            setMyRequests(requestsData);
        } catch (error) {
            toast.error("فشل في جلب الباقات المتاحة");
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (planId: number, isPaid: boolean) => {
        setSubmitting(planId);
        try {
            // مؤقتاً: إرسال جميع الطلبات لتكون تحت المراجعة من قبل الإدارة
            if (isPaid) {
                const { paymentUrl } = await subscriptionApi.initiatePayment(planId);
                window.location.href = paymentUrl;
            } else {
                await subscriptionApi.requestSubscription(planId);
                toast.success("تم تقديم طلب الاشتراك المجاني بنجاح.");
                fetchData();
            }
        } catch (error) {
            let errMsg = getErrorMessage(error) || "";
            if (errMsg.toLowerCase().includes("pending request") || errMsg.includes("AlreadyExists")) {
                errMsg = "لديك بالفعل طلب اشتراك قيد المراجعة حالياً، يرجى الانتظار حتى يتم قبوله من الإدارة.";
            } else if (errMsg.includes("unavailable")) {
                errMsg = "هذه الباقة غير متاحة حالياً.";
            }
            toast.error(errMsg || "فشل في تقديم الطلب، لسبب غير معروف");
        } finally {
            setSubmitting(null);
        }
    };

    const hasPendingRequest = (planId: number) => {
        return myRequests.some(r => r.planId === planId && (r.status === "Pending" || r.status === "PaymentPending"));
    };

    return (
        <MainLayout>
            <div className="container mx-auto py-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-primary">اختر الباقة المناسبة لك</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        ارتقِ بتجربة تصحيح الاختبارات واختر من بين باقاتنا المتنوعة التي تناسب احتياجاتك التعليمية.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-muted">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">لا توجد باقات متاحة حالياً</h2>
                        <p className="text-muted-foreground mb-6">يرجى التواصل مع الإدارة لمزيد من المعلومات.</p>
                        <Button asChild variant="outline">
                            <Link to="/dashboard">العودة للوحة التحكم</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="flex overflow-x-auto pb-8 pt-4 snap-x snap-mandatory gap-6 px-4 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {plans.map((plan) => (
                            <div key={plan.id} className="snap-center shrink-0 w-[320px] md:w-[360px]">
                                <Card
                                    className={cn(
                                        "relative flex flex-col h-full transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden",
                                        plan.price > 0 ? "border-primary/20" : "border-muted"
                                    )}
                                >
                                    {plan.price > 100 && (
                                        <div className="absolute top-0 right-12 translate-y-[-100%] group-hover:translate-y-0 transition-transform bg-primary text-primary-foreground px-4 py-1 rounded-b-lg text-xs font-bold z-10">
                                            الأكثر طلباً
                                        </div>
                                    )}

                                    <CardHeader className="text-center pb-8 border-b bg-muted/20">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                            {plan.price === 0 ? <Shield className="h-6 w-6 text-primary" /> : <Zap className="h-6 w-6 text-primary" />}
                                        </div>
                                        <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                                        <div className="flex items-baseline justify-center gap-1 mt-4">
                                            <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                                            <span className="text-muted-foreground font-semibold">ج.م</span>
                                        </div>
                                        <CardDescription className="mt-4 text-sm font-medium">
                                            {plan.durationValue} {plan.durationUnit === "Month" ? "شهر" : plan.durationUnit === "Term" ? "ترم" : "سنة"}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 pt-8 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <FileText className="h-3 w-3 text-primary" />
                                            </div>
                                            <span className="font-semibold text-lg">{plan.maxAllowedPages} صفحة مصححة</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Clock className="h-3 w-3 text-primary" />
                                            </div>
                                            <span>صلاحية لمدة {plan.durationValue} {plan.durationUnit === "Month" ? "شهر" : plan.durationUnit === "Term" ? "ترم" : "سنة"}</span>
                                        </div>

                                        {plan.description && (
                                            <div className="pt-4 border-t border-muted mt-4">
                                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                                    {plan.description}
                                                </p>
                                            </div>
                                        )}

                                        <ul className="space-y-3 pt-4">
                                            <li className="flex items-center gap-2 text-sm">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span>دعم فني متميز</span>
                                            </li>
                                            <li className="flex items-center gap-2 text-sm">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span>تحديثات النظام المستمرة</span>
                                            </li>
                                        </ul>
                                    </CardContent>

                                    <CardFooter className="pt-6 border-t">
                                        <Button
                                            className="w-full h-12 text-lg font-bold"
                                            onClick={() => handleRequest(plan.id, plan.price > 0)}
                                            disabled={submitting === plan.id || hasPendingRequest(plan.id)}
                                            variant={plan.price > 0 ? "default" : "outline"}
                                        >
                                            {hasPendingRequest(plan.id) ? "الطلب قيد المراجعة" :
                                                submitting === plan.id ? "جاري الإرسال..." :
                                                    (plan.price > 0 ? "طلب اشتراك" : "اشتراك مجاني")}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}


            </div>
        </MainLayout>
    );
}
