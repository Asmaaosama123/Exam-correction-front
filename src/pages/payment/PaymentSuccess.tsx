import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const chargeId = searchParams.get("charge_id");

    useEffect(() => {
        // Optional: Call an endpoint to verify status if needed, 
        // but the webhook will take care of the actual activation
    }, [chargeId]);

    return (
        <MainLayout>
            <div className="container mx-auto py-12 px-4 flex justify-center items-center min-h-[70vh]">
                <Card className="max-w-md w-full border-green-200 shadow-lg text-center animate-in zoom-in duration-500">
                    <CardHeader className="pb-6">
                        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold text-green-700">الدفع ناجح</CardTitle>
                        <CardDescription className="text-lg mt-2">
                            شكراً لك! تم استلام دفعتك بنجاح.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chargeId && (
                            <div className="bg-muted/50 p-3 rounded-lg text-sm flex items-center justify-center gap-2 mb-4">
                                <span className="text-muted-foreground">رقم العملية:</span>
                                <span className="font-mono font-bold">{chargeId}</span>
                            </div>
                        )}
                        <p className="text-muted-foreground">
                            تم تفعيل اشتراكك وإضافة الباقة لحسابك. يتم معالجة طلبك حالياً بواسطة النظام.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-6 pb-8">
                        <Button onClick={() => navigate("/dashboard")} className="gap-2" size="lg">
                            <Home className="w-5 h-5" />
                            العودة للوحة التحكم
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </MainLayout>
    );
}
