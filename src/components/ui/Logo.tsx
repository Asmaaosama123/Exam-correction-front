import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
};

export default function Logo({
  className,
  size = "md",
  showText = false,
}: LogoProps) {
  const { resolvedTheme } = useTheme();

  // Determine logo based on theme
  const logoSrc =
    resolvedTheme === "dark" ? "/logo-circle.png" : "/logo-no-bg.png";
  const sizeClass = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logoSrc}
        alt="نظام إدارة الامتحانات"
        className={cn(sizeClass, "object-contain")}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            نظام إدارة الامتحانات
          </span>
          <span className="text-xs text-muted-foreground">
            Exam Management System
          </span>
        </div>
      )}
    </div>
  );
}
