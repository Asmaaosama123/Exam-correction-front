import { Wrench, Clock, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "./MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/ui/Logo";

const UnderConstructions = () => {
  return (
    <MainLayout>
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-8 text-center">
          {/* Logo */}
          <div className="mb-6 inline-flex items-center justify-center">
            <Logo size="3xl" />
          </div>

          {/* Main Icon and Title */}
          <div className="space-y-4">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Wrench className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              قيد الإنشاء
            </h1>
            <p className="text-xl font-medium text-muted-foreground">
              نعمل بجد لإعداد هذه الصفحة لك
            </p>
          </div>

          {/* Info Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>نحن نعمل على تحسين تجربتك</CardTitle>
              <CardDescription className="text-base">
                هذه الصفحة قيد التطوير حالياً. سنكون جاهزين قريباً!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  نشكرك على صبرك. نحن نعمل بجد لإضافة ميزات جديدة وتحسين تجربة
                  المستخدم.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Button variant="default" size="lg" asChild>
              <a href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4 ml-2" />
                العودة للصفحة الرئيسية
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للخلف
            </Button>
          </div>

          {/* Additional Info */}
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              للاستفسارات، يرجى{" "}
              <a
                href="/contact"
                className="font-semibold text-primary hover:underline"
              >
                الاتصال بنا
              </a>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UnderConstructions;
