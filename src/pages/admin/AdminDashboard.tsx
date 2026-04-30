import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import type { AdminStats, AdminAdvancedStats } from "@/lib/adminApi";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { Users, FileText, CreditCard, Settings2, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [advancedStats, setAdvancedStats] = useState<AdminAdvancedStats | null>(null);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [settingsLoading, setSettingsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, settingsData, advancedStatsData] = await Promise.all([
                    adminApi.getStats(),
                    adminApi.getSettings(),
                    adminApi.getAdvancedStats()
                ]);
                setStats(statsData);
                setSettings(settingsData);
                setAdvancedStats(advancedStatsData);
            } catch (error) {
                console.error("Failed to fetch admin data:", error);
                toast.error("فشل في جلب بيانات لوحة التحكم");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleToggleSubscription = async (checked: boolean) => {
        try {
            setSettingsLoading(true);
            const newValue = checked ? "true" : "false";
            await adminApi.updateSetting("IsSubscriptionRequired", newValue);
            setSettings(prev => ({ ...prev, IsSubscriptionRequired: newValue }));
            toast.success(checked ? "تم تفعيل نظام الاشتراكات" : "تم إيقاف نظام الاشتراكات");
        } catch (error) {
            console.error("Failed to update setting:", error);
            toast.error("فشل في تحديث الإعدادات");
        } finally {
            setSettingsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم الإدارة</h1>
                    <p className="text-muted-foreground mt-2">
                        مرحباً بك في لوحة تحكم النظام. من هنا يمكنك إدارة المستخدمين والاطلاع على الإحصائيات.
                    </p>
                </div>

                {/* System Settings Moved to Top */}
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                    <Card className="border-primary/10 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">إعدادات النظام</CardTitle>
                            </div>
                            <CardDescription>التحكم في الخصائص العامة للموقع</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-100 transition-all hover:shadow-md">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${settings.IsSubscriptionRequired === "true" ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {settings.IsSubscriptionRequired === "true" ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                        </div>
                                        <Label htmlFor="subscription-mode" className="text-base font-bold text-slate-800">
                                            نظام الاشتراكات والكوتا
                                        </Label>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed pr-8">
                                        عند التفعيل، سيتم تقييد المستخدمين بعدد الصفحات المتاحة في حساباتهم وإلزامهم بباقات اشتراك فعالة.
                                    </p>
                                </div>
                                
                                <Button
                                    size="lg"
                                    variant={settings.IsSubscriptionRequired === "true" ? "default" : "outline"}
                                    className={`w-full sm:w-44 rounded-xl font-bold transition-all shadow-sm ${
                                        settings.IsSubscriptionRequired === "true" 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' 
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                    onClick={() => handleToggleSubscription(settings.IsSubscriptionRequired !== "true")}
                                    disabled={settingsLoading}
                                >
                                    {settingsLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                    ) : settings.IsSubscriptionRequired === "true" ? (
                                        <ShieldCheck className="h-4 w-4 ml-2" />
                                    ) : (
                                        <ShieldAlert className="h-4 w-4 ml-2" />
                                    )}
                                    {settings.IsSubscriptionRequired === "true" ? "نظام مفعل" : "تفعيل النظام"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="h-4 w-24 bg-muted rounded"></div>
                                    <div className="h-4 w-4 bg-muted rounded"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-8 w-16 bg-muted rounded mt-2"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    إجمالي المستخدمين
                                </CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    إجمالي المشتركين
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalSubscribers || 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    إجمالي الصفحات المصححة
                                </CardTitle>
                                <FileText className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalCorrectedPages || 0}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Dashboard Charts */}
                {!loading && advancedStats && (
                    <DashboardCharts 
                        revenueData={advancedStats.revenueData}
                        popularPlansData={advancedStats.popularPlansData}
                        subscriptionStatusData={advancedStats.subscriptionStatusData}
                        examActivityData={advancedStats.examActivityData}
                    />
                )}

            </div>
        </AdminLayout>
    );
}
