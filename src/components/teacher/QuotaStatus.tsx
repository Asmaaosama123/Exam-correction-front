import { AlertCircle, CreditCard, BatteryMedium, BatteryWarning, BatteryFull, CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface QuotaStatusProps {
  usedPages: number;
  maxAllowedPages: number;
  isSubscribed: boolean;
  expiryDate: string | null;
}

export function QuotaStatus({
  usedPages,
  maxAllowedPages,
  isSubscribed,
  expiryDate
}: QuotaStatusProps) {
  const navigate = useNavigate();
  const remaining = Math.max(0, maxAllowedPages - usedPages);
  const percentage = maxAllowedPages > 0 ? (usedPages / maxAllowedPages) * 100 : 0;
  
  const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
  const isOutOfPages = maxAllowedPages > 0 && usedPages >= maxAllowedPages;

  if (!isSubscribed && isExpired) {
    return (
      <Card className="border-2 border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg font-semibold text-destructive">
              انتهى الاشتراك
            </CardTitle>
          </div>
          <CardDescription className="text-base text-destructive/80">
            لقد انتهت فترة اشتراكك في المنصة. يرجى تجديد الاشتراك للاستمرار في تصحيح الاختبارات.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/teacher/plans')} className="w-full sm:w-auto mt-2">
            <CreditCard className="h-4 w-4 ml-2" />
            تجديد الاشتراك
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isOutOfPages) {
    return (
      <Card className="border-2 border-orange-500/50 bg-orange-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BatteryWarning className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              نفذ رصيد الصفحات
            </CardTitle>
          </div>
          <CardDescription className="text-base text-orange-600/80 dark:text-orange-400/80">
            لقد استنفدت جميع الأوراق المتاحة في باقتك الحالية ({maxAllowedPages} ورقة). تحتاج إلى ترقية باقتك للتمكن من التصحيح.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/teacher/plans')} variant="default" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto mt-2">
            <CreditCard className="h-4 w-4 ml-2" />
            شراء باقة جديدة
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active Subscription mapping colors
  const barColor = percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-orange-500' : 'bg-primary';
  const Icon = percentage > 90 ? BatteryWarning : percentage > 50 ? BatteryMedium : BatteryFull;

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${percentage > 90 ? 'text-red-500' : 'text-primary'}`} />
            <CardTitle className="text-lg font-semibold">استهلاك باقة التصحيح</CardTitle>
            </div>
            {expiryDate && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    <CalendarDays className="h-4 w-4" />
                    <span>ينتهي في: {new Date(expiryDate).toLocaleDateString("ar-EG")}</span>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="flex justify-between text-sm">
                <span>تم استخدام: <strong className="text-lg">{usedPages}</strong></span>
                <span>المتبقي: <strong className="text-lg">{remaining}</strong> ورقة</span>
            </div>
            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            {percentage > 90 && (
                <p className="text-sm text-red-500 font-medium pt-1">
                    تنبيه: لقد أوشكت على إنهاء رصيد الباقة الحالي!
                </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
