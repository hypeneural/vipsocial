import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams, FilterParams } from "./types";
import { User, UserRole, UserPreferences } from "@/types/user";

// ==========================================
// TYPES
// ==========================================
export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    department?: string;
    active?: boolean;
    send_welcome_email?: boolean;
}

export interface UpdateUserDTO {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    phone?: string;
    department?: string;
    active?: boolean;
}

export interface UserFilters extends FilterParams {
    role?: UserRole;
    department?: string;
}

// ==========================================
// USER SERVICE
// ==========================================
export const userService = {
    /**
     * List all users with pagination
     */
    getAll: async (
        params?: ListParams & UserFilters
    ): Promise<PaginatedResponse<User>> => {
        const { data } = await api.get<PaginatedResponse<User>>("/users", { params });
        return data;
    },

    /**
     * Get single user by ID
     */
    getById: async (id: number): Promise<ApiResponse<User>> => {
        const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
        return data;
    },

    /**
     * Create new user
     */
    create: async (userData: CreateUserDTO): Promise<ApiResponse<User>> => {
        const { data } = await api.post<ApiResponse<User>>("/users", userData);
        return data;
    },

    /**
     * Update user
     */
    update: async (id: number, userData: UpdateUserDTO): Promise<ApiResponse<User>> => {
        const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
        return data;
    },

    /**
     * Delete user
     */
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/users/${id}`);
        return data;
    },

    /**
     * Toggle user active status
     */
    toggleActive: async (id: number): Promise<ApiResponse<User>> => {
        const { data } = await api.patch<ApiResponse<User>>(`/users/${id}/toggle-active`);
        return data;
    },

    /**
     * Update current user profile
     */
    updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
        const { data } = await api.put<ApiResponse<User>>("/users/profile", userData);
        return data;
    },

    /**
     * Get user preferences
     */
    getPreferences: async (): Promise<ApiResponse<UserPreferences>> => {
        const { data } = await api.get<ApiResponse<UserPreferences>>("/users/preferences");
        return data;
    },

    /**
     * Update user preferences
     */
    updatePreferences: async (
        prefs: Partial<UserPreferences>
    ): Promise<ApiResponse<UserPreferences>> => {
        const { data } = await api.put<ApiResponse<UserPreferences>>("/users/preferences", prefs);
        return data;
    },

    /**
     * Upload avatar
     */
    uploadAvatar: async (file: File): Promise<ApiResponse<{ avatar_url: string }>> => {
        const formData = new FormData();
        formData.append("avatar", file);

        const { data } = await api.post<ApiResponse<{ avatar_url: string }>>(
            "/users/avatar",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return data;
    },
};

export default userService;
