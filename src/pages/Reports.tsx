import {
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  Filter,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { ExportStudentsDialog } from "@/components/students/ExportStudentsDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

const reportData = [
  {
    title: "تقرير الأداء العام",
    description: "نظرة شاملة على أداء الطلاب في جميع الاختبارات",
    icon: BarChart3,
    date: "2024-01-15",
    downloads: 45,
  },
  {
    title: "تقرير النتائج النهائية",
    description: "نتائج الفصل الدراسي الأول لجميع الصفوف",
    icon: TrendingUp,
    date: "2024-01-10",
    downloads: 78,
  },
  {
    title: "تقرير الحضور والغياب",
    description: "إحصائيات حضور الطلاب في الاختبارات",
    icon: FileText,
    date: "2024-01-05",
    downloads: 32,
  },
  {
    title: "تقرير التصحيح الآلي",
    description: "إحصائيات دقة التصحيح باستخدام الذكاء الاصطناعي",
    icon: BarChart3,
    date: "2024-01-01",
    downloads: 56,
  },
];

const chartData = [
  { month: "يناير", value: 85, color: "bg-primary" },
  { month: "فبراير", value: 78, color: "bg-primary" },
  { month: "مارس", value: 92, color: "bg-primary" },
  { month: "أبريل", value: 88, color: "bg-primary" },
  { month: "مايو", value: 95, color: "bg-primary" },
  { month: "يونيو", value: 90, color: "bg-primary" },
];

export default function Reports() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">التقارير</h1>
            <p className="text-muted-foreground mt-2">
              عرض وتحميل التقارير والإحصائيات التفصيلية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Users className="h-4 w-4 ml-2" />
              تصدير الطلاب
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 ml-2" />
              تصفية
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 ml-2" />
              اختيار التاريخ
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي التقارير
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.length}</div>
              <p className="text-xs text-muted-foreground mt-1">تقرير متاح</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي التحميلات
              </CardTitle>
              <Download className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.reduce((sum, r) => sum + r.downloads, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                تحميل هذا الشهر
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground mt-1">
                +3% من الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                التقارير المحدثة
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">
                في آخر 7 أيام
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Reports List */}
          {reportData.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.title} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {report.downloads} تحميل
                    </span>
                    <span className="text-muted-foreground">{report.date}</span>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Download className="h-4 w-4 ml-2" />
                    تحميل التقرير
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الأداء الشهرية</CardTitle>
            <CardDescription>
              معدل النجاح الشهري للطلاب خلال آخر 6 أشهر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-64">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="relative flex w-full flex-col items-center justify-end">
                    <div
                      className={cn(
                        "w-full rounded-t transition-all hover:opacity-80",
                        item.color
                      )}
                      style={{ height: `${(item.value / 100) * 200}px` }}
                    />
                    <div className="absolute -bottom-6 text-xs font-medium">
                      {item.value}%
                    </div>
                  </div>
                  <div className="mt-8 text-xs text-muted-foreground">
                    {item.month}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Last Activity Section - Commented out for future implementation */}
        {/* 
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>
              آخر التقارير التي تم إنشاؤها أو تحميلها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
            </div>
          </CardContent>
        </Card>
        */}
      </div>

      {/* Export Students Dialog */}
      <ExportStudentsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </MainLayout>
  );
}
