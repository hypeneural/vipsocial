import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";

// ==========================================
// TYPES
// ==========================================
interface ProtectedRouteProps {
    children: ReactNode;
    requiredRoles?: UserRole[];
    redirectTo?: string;
}

// ==========================================
// LOADING COMPONENT
// ==========================================
function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-10 h-10 text-primary" />
                </motion.div>
                <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
            </motion.div>
        </div>
    );
}

// ==========================================
// PROTECTED ROUTE COMPONENT
// ==========================================
export function ProtectedRoute({
    children,
    requiredRoles,
    redirectTo = "/auth/login",
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    // Show loading while checking auth
    if (isLoading) {
        return <AuthLoading />;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Check role-based access
    if (requiredRoles && requiredRoles.length > 0 && user) {
        const hasRequiredRole = requiredRoles.includes(user.role);
        if (!hasRequiredRole) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
}

// ==========================================
// PUBLIC ROUTE (only for non-authenticated users)
// ==========================================
interface PublicRouteProps {
    children: ReactNode;
    redirectTo?: string;
}

export function PublicRoute({
    children,
    redirectTo = "/",
}: PublicRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <AuthLoading />;
    }

    // Redirect authenticated users to dashboard
    if (isAuthenticated) {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || redirectTo;
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
}

// ==========================================
// ROLE-BASED COMPONENT
// ==========================================
interface RequireRoleProps {
    children: ReactNode;
    roles: UserRole[];
    fallback?: ReactNode;
}

export function RequireRole({ children, roles, fallback = null }: RequireRoleProps) {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
