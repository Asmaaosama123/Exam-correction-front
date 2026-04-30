import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import Header from "./Header";
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

  const isAdmin = user?.roles?.some(role => role.toLowerCase() === "admin") || user?.email === 'superadmin@wsyli.com' || user?.email === 'admin@exam-correction.com';

  // Full layout with sidebar for authenticated users
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="flex flex-col relative">
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
