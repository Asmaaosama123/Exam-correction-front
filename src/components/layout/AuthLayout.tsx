import Header from "./header";
import Footer from "./Footer";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header showSidebarTrigger={false} />
      <main className={cn("flex flex-1 flex-col", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

