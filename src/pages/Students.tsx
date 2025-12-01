import { useState } from "react";
import { Users, Search, Plus, Edit, Trash2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";

// Mock data
const students = [
  {
    id: 1,
    name: "أحمد محمد العلي",
    email: "ahmed@example.com",
    phone: "0501234567",
    grade: "الصف الثالث الثانوي",
    status: "نشط",
  },
  {
    id: 2,
    name: "فاطمة عبدالله السالم",
    email: "fatima@example.com",
    phone: "0502345678",
    grade: "الصف الثاني الثانوي",
    status: "نشط",
  },
  {
    id: 3,
    name: "خالد سعد الدوسري",
    email: "khalid@example.com",
    phone: "0503456789",
    grade: "الصف الأول الثانوي",
    status: "غير نشط",
  },
  {
    id: 4,
    name: "سارة علي القحطاني",
    email: "sara@example.com",
    phone: "0504567890",
    grade: "الصف الثالث الثانوي",
    status: "نشط",
  },
];

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter(
    (student) =>
      student.name.includes(searchQuery) ||
      student.email.includes(searchQuery) ||
      student.phone.includes(searchQuery)
  );

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الطلاب</h1>
            <p className="text-muted-foreground mt-2">
              إدارة بيانات الطلاب المسجلين في النظام
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة طالب جديد
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي الطلاب
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                طالب مسجل في النظام
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                الطلاب النشطون
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter((s) => s.status === "نشط").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                طالب نشط حالياً
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                طلاب جدد هذا الشهر
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">
                +5 من الشهر الماضي
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الطلاب</CardTitle>
            <CardDescription>عرض وإدارة جميع الطلاب المسجلين</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن طالب بالاسم أو البريد الإلكتروني أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      الاسم
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      البريد الإلكتروني
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      رقم الهاتف
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      الصف
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      الحالة
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b transition-colors hover:bg-accent/50"
                    >
                      <td className="p-4">
                        <div className="font-medium">{student.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {student.phone}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{student.grade}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            student.status === "نشط"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-50 text-gray-700"
                          )}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  لم يتم العثور على طلاب
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
