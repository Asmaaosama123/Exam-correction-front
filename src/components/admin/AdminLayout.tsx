import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import Header from "../layout/Header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";

interface AdminLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
    const { data: user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
    }

    // Ensure only the admin can access this layout
    const isAdmin = user?.roles?.includes("Admin") || user?.email === "admin@exam-correction.com" || user?.email === "superadmin@wsyli.com";
    if (!user || !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col font-cairo">
                <Header showSidebarTrigger={true} />
                <div className="flex flex-1">
                    <AdminSidebar />
                    <SidebarInset className="flex flex-col flex-1 bg-muted/30">
                        <main className={cn("flex-1 p-6 md:p-8 overflow-auto", className)}>
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </div>
        </SidebarProvider>
    );
}
