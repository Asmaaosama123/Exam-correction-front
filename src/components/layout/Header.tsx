import { LogIn, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { joinFullName } from "@/lib/name-utils";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  className?: string;
  showSidebarTrigger?: boolean;
}

export default function Header({
  className,
  showSidebarTrigger = true,
}: HeaderProps) {
  const { data: user, isLoading } = useAuth();
  const logout = useLogout();

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
        <div className="flex items-center gap-3">
          {showSidebarTrigger && user && <SidebarTrigger />}
          <Link to="/" className="flex items-center gap-2">
            <Logo
              size="lg"
              showText
              className="[&>div]:hidden sm:[&>div]:flex"
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {joinFullName(user.firstName, user.lastName) || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {joinFullName(user.firstName, user.lastName) || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <User className="h-4 w-4 ml-2" />
                    لوحة التحكم
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="bg-primary hover:bg-[#0a6a38]"
              asChild
            >
              <Link to="/login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">تسجيل الدخول</span>
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
