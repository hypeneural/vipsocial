import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShimmerPage } from "@/components/Shimmer";

/**
 * Protects routes that require authentication.
 * - While auth is loading: shows shimmer placeholder
 * - If not authenticated: redirects to /auth/login
 * - If authenticated: renders child routes via <Outlet />
 */
export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <ShimmerPage />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
}
