import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { QuotaStatus } from "@/components/teacher/QuotaStatus";
import { useAuth } from "@/hooks/use-auth";
import { subscriptionApi } from "@/lib/subscriptionApi";
import type { SubscriptionRequest } from "@/lib/adminApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { HelpFab } from "@/components/ui/help-fab";

export default function Dashboard() {
  const { data: user } = useAuth();
  const [history, setHistory] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await subscriptionApi.getMyRequests();
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch billing history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الرئيسية</h1>
          <p className="text-muted-foreground mt-2">
            مرحباً بك {user?.firstName}! تابع رصيد باقتك وسجل طلباتك من هنا.
          </p>
        </div>

        {/* Celebratory Banner for Free Mode */}
        {user && user.isSubscriptionModeEnabled === false && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg border border-emerald-400 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
               <CheckCircle2 className="h-24 w-24" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-2xl">🎉</span>
              </div>
              <div className="text-center sm:text-right">
                <h3 className="text-xl font-bold">الموقع متاح الآن مجاناً بالكامل!</h3>
                <p className="text-emerald-50 mt-1">
                  استمتع بكافة مميزات التصحيح المفتوح لجميع اختباراتك وطلابك لفترة محدودة.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quota Progress Status */}
        {user && user.isSubscriptionModeEnabled !== false && (
            <QuotaStatus
                usedPages={user.usedPages}
                maxAllowedPages={user.maxAllowedPages}
                isSubscribed={user.isSubscribed}
                expiryDate={user.subscriptionExpiryUtc || null}
            />
        )}

        {/* Billing History - Only show if subscription mode is enabled */}
        {user && user.isSubscriptionModeEnabled !== false && (
          <Card className="mt-4">
              <CardHeader>
                  <CardTitle>سجل الباقات والفواتير</CardTitle>
                  <CardDescription>جميع طلبات الاشتراك السابقة وحالتها</CardDescription>
              </CardHeader>
              <CardContent>
                  {loading ? (
                      <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                  ) : history.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                          لا يوجد سجل للاشتراكات حتى الآن
                      </div>
                  ) : (
                      <div className="rounded-md border overflow-x-auto">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead className="text-right">الباقة</TableHead>
                                      <TableHead className="text-right">تاريخ الطلب</TableHead>
                                      <TableHead className="text-center">الحالة</TableHead>
                                      <TableHead className="text-right">تاريخ التفعيل</TableHead>
                                      <TableHead className="text-right">ملاحظات الإدارة</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {history.map((req) => (
                                      <TableRow key={req.id}>
                                          <TableCell className="font-medium">{req.planName}</TableCell>
                                          <TableCell>{new Date(req.requestedAt).toLocaleDateString("ar-EG")}</TableCell>
                                          <TableCell className="text-center">
                                              {req.status === "Approved" ? (
                                                  <span className="flex items-center justify-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                                                      <CheckCircle2 className="h-3 w-3" /> مفعل
                                                  </span>
                                              ) : req.status === "Rejected" ? (
                                                  <span className="flex items-center justify-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">
                                                      <XCircle className="h-3 w-3" /> مرفوض
                                                  </span>
                                              ) : (
                                                  <span className="flex items-center justify-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs">
                                                      <Clock className="h-3 w-3" /> قيد المراجعة
                                                  </span>
                                              )}
                                          </TableCell>
                                          <TableCell>
                                              {req.processedAt ? new Date(req.processedAt).toLocaleDateString("ar-EG") : "-"}
                                          </TableCell>
                                          <TableCell className="text-muted-foreground">
                                              {req.adminNotes || "-"}
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  )}
              </CardContent>
          </Card>
        )}
            </div>
            
            <HelpFab
                title="كيفية استخدام لوحة التحكم"
                description="مرحباً بك في لوحة تحكم المعلم. هذه الصفحة هي نقطة انطلاقك الرئيسية."
                tooltip="دليل استخدام لوحة التحكم"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">من خلال هذه الصفحة يمكنك النظرة السريعة على حسابك كمعلم:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
                        <li><strong>استهلاك باقة التصحيح:</strong> يوضح لك عدد الأوراق المتبقية لديك من إجمالي سعة باقتك الحالية.</li>
                        <li><strong>سجل الباقات والفواتير:</strong> يمكنك متابعة جميع طلبات الاشتراك التي قدمتها سابقاً للإدارة، ومعرفة إذا كانت قيد المراجعة أو تم تفعيلها.</li>
                        <li>للترقية أو إضافة باقة جديدة، يمكنك الذهاب إلى علامة التبويب "الباقات".</li>
                    </ul>
                </div>
            </HelpFab>
        </MainLayout>
    );
}
