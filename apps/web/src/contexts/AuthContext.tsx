import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { User, LoginCredentials } from "@/types/user";
import { authService, AuthResponse } from "@/services/auth.service";
import { getToken, clearAuth } from "@/services/api";
import showToast from "@/lib/toast";

// ==========================================
// TYPES
// ==========================================
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    logout: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    refreshUser: () => Promise<void>;
}

// ==========================================
// CONTEXT
// ==========================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// PROVIDER
// ==========================================
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const isAuthenticated = !!user;

    // Load user on mount if token exists
    useEffect(() => {
        const initAuth = async () => {
            const token = getToken();
            if (token) {
                try {
                    const response = await authService.me();
                    if (response.success) {
                        setUser(response.data);
                    }
                } catch (error) {
                    console.error("Failed to load user:", error);
                    clearAuth();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    /**
     * Login with credentials
     */
    const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            const response = await authService.login(credentials);
            if (response.success) {
                setUser(response.data.user);
                showToast.success(`Bem-vindo, ${response.data.user.name}!`);
                return true;
            }
            return false;
        } catch (error: any) {
            const message = error.response?.data?.message || "Credenciais inválidas";
            showToast.error(message);
            return false;
        }
    }, []);

    /**
     * Logout user
     */
    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (error) {
            // Ignore errors on logout
        } finally {
            setUser(null);
            navigate("/auth/login");
        }
    }, [navigate]);

    /**
     * Update local user data
     */
    const updateUser = useCallback((userData: Partial<User>) => {
        setUser((prevUser) => (prevUser ? { ...prevUser, ...userData } : null));
    }, []);

    /**
     * Refresh user data from server
     */
    const refreshUser = useCallback(async () => {
        try {
            const response = await authService.me();
            if (response.success) {
                setUser(response.data);
            }
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                logout,
                updateUser,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ==========================================
// HOOK
// ==========================================
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
