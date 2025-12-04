import { Link } from "react-router-dom";
import {
  Users,
  FileCheck,
  CheckSquare,
  BarChart3,
  ArrowLeft,
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
import { useAuth } from "@/hooks/use-auth";
import { joinFullName } from "@/lib/name-utils";
import Logo from "@/components/ui/Logo";

const features = [
  {
    title: "إدارة الطلاب",
    description: "نظام شامل لإدارة بيانات الطلاب والتسجيل",
    icon: Users,
    href: "/students",
  },
  {
    title: "الاختبارات",
    description: "إنشاء وإدارة الاختبارات بسهولة",
    icon: FileCheck,
    href: "/exams",
  },
  {
    title: "التصحيح الآلي",
    description: "تصحيح تلقائي باستخدام الذكاء الاصطناعي",
    icon: CheckSquare,
    href: "/grading",
  },
  {
    title: "التقارير",
    description: "تقارير مفصلة وإحصائيات شاملة",
    icon: BarChart3,
    href: "/reports",
  },
];

export default function Home() {
  const { data: user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-8 p-6">
        {/* Hero Section */}
        <div className="mx-auto w-full max-w-4xl text-center">
          <div className="flex justify-center">
            <Logo size="3xl" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-foreground sm:text-5xl">
            {isAuthenticated
              ? `مرحباً ${joinFullName(user.firstName, user.lastName) || user.email || ""} في نظام إدارة الامتحانات`
              : "مرحباً بك في نظام إدارة الامتحانات"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            نظام متكامل لإدارة وتصحيح الامتحانات باستخدام الذكاء الاصطناعي
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  الذهاب إلى لوحة التحكم
                  <ArrowLeft className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/register">
                    ابدأ الآن
                    <ArrowLeft className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold text-center text-foreground">
            المميزات الرئيسية
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="transition-all hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={feature.href}>
                        اكتشف المزيد
                        <ArrowLeft className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">إحصائيات النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1,234</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    طالب مسجل
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">45</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    اختبار نشط
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">8,567</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    ورقة مصححة
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
