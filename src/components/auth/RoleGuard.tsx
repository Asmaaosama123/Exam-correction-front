import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

/**
 * RoleGuard - Protects routes based on user roles
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { data: user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasRequiredRole = user?.roles?.some((role) =>
        allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())
    );

    if (!user || !hasRequiredRole) {
        // If user is logged in but doesn't have the role, redirect to dashboard
        if (user) {
            return <Navigate to="/dashboard" replace />;
        }
        // Otherwise redirect to login
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
