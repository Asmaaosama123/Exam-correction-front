import { LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
        className
      )}
    >
      <nav
        aria-label="الملاحة الرئيسية"
        className="mx-auto flex max-w-full items-center justify-between px-4 py-3 lg:px-6"
      >
        {/* Logo and Sidebar Trigger */}
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <a href="/" className="flex items-center gap-2">
            <Logo
              size="lg"
              showText
              className="[&>div]:hidden sm:[&>div]:flex"
            />
          </a>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
            <a href="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">الملف الشخصي</span>
            </a>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-[#0a6a38]"
            asChild
          >
            <a href="/login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">تسجيل الدخول</span>
            </a>
          </Button>
        </div>
      </nav>
    </header>
  );
}
