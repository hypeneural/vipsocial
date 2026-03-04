import api, { setToken, setRefreshToken, clearAuth } from "./api";
import { ApiResponse } from "./types";
import { User, LoginCredentials } from "@/types/user";

// ==========================================
// TYPES
// ==========================================
export interface AuthResponse {
    token: string;
    refresh_token?: string;
    user: User;
    expires_in: number;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    token: string;
    password: string;
    password_confirmation: string;
}

// ==========================================
// AUTH SERVICE
// ==========================================
export const authService = {
    /**
     * Login user
     */
    login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
        const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/login", credentials);

        if (data.success && data.data) {
            setToken(data.data.token);
            if (data.data.refresh_token) {
                setRefreshToken(data.data.refresh_token);
            }
        }

        return data;
    },

    /**
     * Register new user
     */
    register: async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
        const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/register", userData);

        if (data.success && data.data) {
            setToken(data.data.token);
            if (data.data.refresh_token) {
                setRefreshToken(data.data.refresh_token);
            }
        }

        return data;
    },

    /**
     * Logout user
     */
    logout: async (): Promise<void> => {
        try {
            await api.post("/auth/logout");
        } finally {
            clearAuth();
        }
    },

    /**
     * Get current user
     */
    me: async (): Promise<ApiResponse<User>> => {
        const { data } = await api.get<ApiResponse<User>>("/auth/me");
        return data;
    },

    /**
     * Request password reset
     */
    forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
        const { data } = await api.post<ApiResponse<void>>("/auth/forgot-password", { email });
        return data;
    },

    /**
     * Reset password with token
     */
    resetPassword: async (params: PasswordResetConfirm): Promise<ApiResponse<void>> => {
        const { data } = await api.post<ApiResponse<void>>("/auth/reset-password", params);
        return data;
    },

    /**
     * Update current user's profile
     */
    updateProfile: async (data: {
        name: string;
        email: string;
        phone?: string;
        department?: string;
    }): Promise<ApiResponse<User>> => {
        const { data: response } = await api.put<ApiResponse<User>>("/auth/profile", data);
        return response;
    },

    /**
     * Update password
     */
    updatePassword: async (
        currentPassword: string,
        newPassword: string,
        newPasswordConfirmation: string
    ): Promise<ApiResponse<void>> => {
        const { data } = await api.put<ApiResponse<void>>("/auth/password", {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: newPasswordConfirmation,
        });
        return data;
    },
};

export default authService;
