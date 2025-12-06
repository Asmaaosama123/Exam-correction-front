import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import Header from "./header";
import Footer from "./Footer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  const { data: user } = useAuth();
  const isAuthenticated = !!user;

  if (!isAuthenticated) {
    // Simple layout without sidebar for unauthenticated users
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

  // Full layout with sidebar for authenticated users
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <main className={cn("flex flex-1 flex-col", className)}>
              {children}
            </main>
            <Footer />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

