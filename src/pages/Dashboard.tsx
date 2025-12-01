import {
  LayoutDashboard,
  Users,
  FileCheck,
  CheckSquare,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";

const stats = [
  {
    title: "إجمالي الطلاب",
    value: "1,234",
    change: "+12%",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "الاختبارات النشطة",
    value: "45",
    change: "+5",
    icon: FileCheck,
    color: "text-primary",
    bgColor: "bg-accent",
  },
  {
    title: "الأوراق المصححة",
    value: "8,567",
    change: "+23%",
    icon: CheckSquare,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "معدل النجاح",
    value: "87%",
    change: "+3%",
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

const recentActivities = [
  {
    title: "تم تصحيح اختبار الرياضيات",
    time: "منذ ساعتين",
    icon: CheckSquare,
  },
  {
    title: "تم تسجيل 15 طالب جديد",
    time: "منذ 4 ساعات",
    icon: Users,
  },
  {
    title: "تم إنشاء اختبار جديد للفيزياء",
    time: "منذ يوم",
    icon: FileCheck,
  },
  {
    title: "تم رفع نتائج الفصل الأول",
    time: "منذ يومين",
    icon: TrendingUp,
  },
];

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-2">
            نظرة عامة على نشاط النظام والإحصائيات
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={cn("rounded-lg p-2", stat.bgColor)}>
                    <Icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-600">{stat.change}</span> من
                    الشهر الماضي
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Activities */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>النشاطات الأخيرة</CardTitle>
              <CardDescription>
                آخر التحديثات والإجراءات في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
              <CardDescription>الوصول السريع للمهام الشائعة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/exams"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <FileCheck className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">إنشاء اختبار جديد</p>
                  <p className="text-xs text-muted-foreground">
                    أضف اختباراً جديداً للنظام
                  </p>
                </div>
              </a>
              <a
                href="/students"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <Users className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">إضافة طلاب</p>
                  <p className="text-xs text-muted-foreground">
                    سجل طلاباً جدد في النظام
                  </p>
                </div>
              </a>
              <a
                href="/grading"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <CheckSquare className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">بدء التصحيح</p>
                  <p className="text-xs text-muted-foreground">
                    ابدأ عملية تصحيح الأوراق
                  </p>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

