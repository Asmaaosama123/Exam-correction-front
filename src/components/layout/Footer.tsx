import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("border-t bg-background mt-auto", className)}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} نظام إدارة الامتحانات. جميع الحقوق محفوظة.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              سياسة الخصوصية
            </a>
            <a
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              الشروط والأحكام
            </a>
            <a
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              اتصل بنا
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
