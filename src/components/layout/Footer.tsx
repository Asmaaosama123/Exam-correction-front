import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t bg-background mt-auto", className)}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <p className="text-sm text-muted-foreground">
              تنفيذ وتطوير برمجي بواسطة |{" "}
              <a
                href="https://team-titans.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-bold"
              >
                TiTans Team
              </a>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              سياسة الخصوصية
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              الشروط والأحكام
            </Link>
            <a
              href="https://exams.wsyelhi.com/help"
              target="_blank"
              rel="noopener noreferrer"
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
