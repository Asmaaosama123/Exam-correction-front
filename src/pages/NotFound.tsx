import { Home, HelpCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotFoundProps {
  className?: string;
}

export default function NotFound({ className }: NotFoundProps) {
  return (
    <main
      className={cn(
        "flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-24 sm:py-32",
        className
      )}
    >
      <div className="text-center">
        {/* 404 Badge */}
        <div className="mb-6 inline-flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent">
            <AlertCircle className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Error Code */}
        <p className="text-6xl font-bold text-primary sm:text-8xl">404</p>

        {/* Main Heading */}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          الصفحة غير موجودة
        </h1>

        {/* Description */}
        <p className="mt-6 text-lg font-medium text-muted-foreground sm:text-xl">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Button variant="default" size="lg" asChild>
            <a href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/contact" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 ml-2" />
              اتصل بالدعم
            </a>
          </Button>
        </div>

        {/* Additional Help Text */}
        <p className="mt-8 text-sm text-muted-foreground">
          إذا كنت تعتقد أن هذا خطأ، يرجى{" "}
          <a
            href="/contact"
            className="font-semibold text-primary hover:underline"
          >
            الاتصال بنا
          </a>
        </p>
      </div>
    </main>
  );
}
