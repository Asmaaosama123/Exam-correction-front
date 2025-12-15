import { Link } from "react-router-dom";
import {
  Users,
  FileCheck,
  CheckSquare,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { joinFullName } from "@/lib/name-utils";
import Logo from "@/components/ui/Logo";

const features = [
  {
    title: "إدارة الطلاب",
    description: "نظام شامل لإدارة بيانات الطلاب والتسجيل",
    icon: Users,
  },
  {
    title: "الاختبارات",
    description: "إنشاء وإدارة الاختبارات بسهولة",
    icon: FileCheck,
  },
  {
    title: "التصحيح الآلي",
    description: "تصحيح تلقائي باستخدام الذكاء الاصطناعي",
    icon: CheckSquare,
  },
  {
    title: "التقارير",
    description: "تقارير مفصلة وإحصائيات شاملة",
    icon: BarChart3,
  },
];

const benefits = [
  {
    icon: Zap,
    title: "سرعة فائقة",
    description: "تصحيح فوري للاختبارات",
  },
  {
    icon: Shield,
    title: "آمن وموثوق",
    description: "حماية كاملة لبياناتك",
  },
  {
    icon: Sparkles,
    title: "ذكاء اصطناعي",
    description: "تقنيات متقدمة للتصحيح التلقائي",
  },
];

export default function Home() {
  const { data: user } = useAuth();
  const isAuthenticated = !!user;

  // Authenticated users see dashboard-style page
  if (isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex flex-1 flex-col gap-8 p-6">
          <div className="mx-auto w-full max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
              مرحباً{" "}
              {joinFullName(user.firstName, user.lastName) ||
                user.phoneNumber ||
                ""}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              نظام متكامل لإدارة وتصحيح الاختبارات باستخدام الذكاء الاصطناعي
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  الذهاب إلى لوحة التحكم
                  <ArrowLeft className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Simple elegant marketing landing page for unauthenticated users
  return (
    <MainLayout>
      <div className="flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-linear-to-b from-background to-muted/20 py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-8 flex justify-center">
                <Logo size="3xl" />
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                وسيلة | تصحيح الاختبارات
              </h1>
              <p className="mb-10 text-xl text-muted-foreground sm:text-2xl">
                حل متكامل لإدارة وتصحيح الاختبارات باستخدام الذكاء الاصطناعي
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/register">
                    إنشاء حساب جديد
                    <ArrowLeft className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6"
                  asChild
                >
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                المميزات الرئيسية
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                كل ما تحتاجه لإدارة الاختبارات بكفاءة
              </p>
            </div>
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="group rounded-lg border bg-card p-6 text-center transition-all hover:shadow-lg hover:border-primary/50"
                    >
                      <div className="mb-4 flex justify-center">
                        <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-muted/50 py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-8 md:grid-cols-3">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-primary/10 p-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                جاهز للبدء؟
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                انضم إلينا اليوم وابدأ في إدارة اختباراتك بكفاءة
              </p>
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="/register">
                  إنشاء حساب جديد
                  <ArrowLeft className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
