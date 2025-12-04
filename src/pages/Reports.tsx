import {
  Download,
  Loader2,
  FileText,
  Users,
  GraduationCap,
  CheckSquare,
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
import { useState } from "react";
import { ExportStudentsDialog } from "@/components/students/ExportStudentsDialog";
import { ExportClassesDialog } from "@/components/classes/ExportClassesDialog";
import { useExportStudents } from "@/hooks/use-students";
import { useGetClasses, useExportClasses } from "@/hooks/use-classes";

const trackDownloads = (type: string) => {
  const downloads = localStorage.getItem("downloads");
  if (downloads) {
    const downloadsObj = JSON.parse(downloads);
    downloadsObj[type] = (downloadsObj[type] || 0) + 1;
    localStorage.setItem("downloads", JSON.stringify(downloadsObj));
  } else {
    localStorage.setItem("downloads", JSON.stringify({ [type]: 1 }));
  }
};

const reportData = [
  {
    title: "تصدير الطلاب | تقارير الطلاب",
    description: "تصدير بيانات الطلاب بصيغة Excel أو PDF",
    icon: Users,
    date: "2025-01-15",
    downloads: 0,
  },
  {
    title: "تصدير الفصول",
    description: "تصدير بيانات الفصول بصيغة Excel أو PDF",
    icon: GraduationCap,
    date: "2025-01-15",
    downloads: 0,
  },
  {
    title: "تقارير المتحانات",
    description: "تقارير المتحانات بصيغة Excel أو PDF",
    icon: FileText,
    date: "2025-01-15",
    downloads: 0,
  },
  {
    title: "تقارير النتائج النهائية",
    description: "تقارير النتائج النهائية بصيغة Excel أو PDF",
    icon: CheckSquare,
    date: "2025-01-15",
    downloads: 0,
  },
];

export default function Reports() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const { data: classesData } = useGetClasses();
  const exportStudentsMutation = useExportStudents();
  const exportClassesMutation = useExportClasses();

  // Load download counts from localStorage
  const getDownloadCount = (reportTitle: string) => {
    const downloads = localStorage.getItem("downloads");
    if (downloads) {
      const downloadsObj = JSON.parse(downloads);
      return downloadsObj[reportTitle] || 0;
    }
    return 0;
  };

  const handleCardClick = (reportTitle: string) => {
    setOpenDialog(reportTitle);
  };

  const handleDownload = async (reportTitle: string) => {
    // For "تصدير الطلاب | تقارير الطلاب", open dialog to select format
    if (reportTitle === "تصدير الطلاب | تقارير الطلاب") {
      setOpenDialog(reportTitle);
    } else if (reportTitle === "تصدير الفصول") {
      // For "تصدير الفصول", open dialog to select format
      setOpenDialog(reportTitle);
    } else {
      // For other reports, open the dialog
      setOpenDialog(reportTitle);
    }
  };

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
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportData.map((report) => {
            const Icon = report.icon;
            const isStudentsReport =
              report.title === "تصدير الطلاب | تقارير الطلاب";
            const isClassesReport = report.title === "تصدير الفصول";
            const isExporting =
              (exportStudentsMutation.isPending && isStudentsReport) ||
              (exportClassesMutation.isPending && isClassesReport);
            return (
              <Card
                key={report.title}
                className="flex flex-col cursor-pointer transition-all hover:shadow-md hover:bg-accent"
                onClick={() => handleCardClick(report.title)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(report.title);
                      }}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {getDownloadCount(report.title)} تحميل
                    </span>
                    <span className="text-muted-foreground">{report.date}</span>
                  </div>
                  <Button
                    className="w-full mt-4 hover:bg-primary hover:text-primary-foreground duration-300 hover:border-primary"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(report.title);
                    }}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري التحميل...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 ml-2" />
                        تحميل التقرير
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Export Students Dialog */}
        {openDialog === "تصدير الطلاب | تقارير الطلاب" && (
          <ExportStudentsDialog
            open={openDialog === "تصدير الطلاب | تقارير الطلاب"}
            onOpenChange={(open) => {
              if (!open) setOpenDialog(null);
            }}
          />
        )}

        {/* Export Classes Dialog */}
        {openDialog === "تصدير الفصول" && (
          <ExportClassesDialog
            open={openDialog === "تصدير الفصول"}
            onOpenChange={(open) => {
              if (!open) setOpenDialog(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
