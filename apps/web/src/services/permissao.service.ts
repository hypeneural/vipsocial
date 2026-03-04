import api from "./api";
import { ApiResponse } from "./types";

// ==========================================
// TYPES
// ==========================================

export interface RoleData {
    id: string;
    name: string;
    description: string;
    icon: string;
    users_count: number;
}

export interface ModuleInfo {
    label: string;
    slug: string;
    icon: string; // Lucide icon name
}

export interface ModulePermissionData {
    module: string;
    slug: string;
    icon: string;
    permissions: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        publish: boolean;
    };
}

export interface PermissoesResponse {
    roles: RoleData[];
    modules: ModuleInfo[];
    permissions: Record<string, Record<string, ModulePermissionData>>;
}

export interface RoleUserData {
    id: number;
    name: string;
    email: string;
    department: string;
    tempo_empresa: string;
}

export interface RoleUsersResponse {
    role: string;
    users: RoleUserData[];
}

export interface UserPermissionsResponse {
    user_id: number;
    name: string;
    email: string;
    role: string;
    direct_permissions: string[];
    all_permissions: string[];
}

// ==========================================
// SERVICE
// ==========================================

export const permissaoService = {
    /**
     * Get all roles with permission matrix and module config
     */
    getAll: async (): Promise<ApiResponse<PermissoesResponse>> => {
        const { data } = await api.get<ApiResponse<PermissoesResponse>>("/pessoas/permissoes");
        return data;
    },

    /**
     * Update permissions for a role
     */
    updateRole: async (
        roleName: string,
        permissions: Record<string, ModulePermissionData>
    ): Promise<ApiResponse<void>> => {
        const { data } = await api.put<ApiResponse<void>>(`/pessoas/permissoes/${roleName}`, {
            permissions,
        });
        return data;
    },

    /**
     * Create a new role
     */
    createRole: async (name: string, description?: string): Promise<ApiResponse<{ id: string; name: string }>> => {
        const { data } = await api.post<ApiResponse<{ id: string; name: string }>>("/pessoas/permissoes/roles", {
            name,
            description,
        });
        return data;
    },

    /**
     * Update role metadata (description)
     */
    updateRoleMeta: async (roleName: string, description: string): Promise<ApiResponse<void>> => {
        const { data } = await api.patch<ApiResponse<void>>(`/pessoas/permissoes/${roleName}`, {
            description,
        });
        return data;
    },

    /**
     * Delete a role (fails if users are linked)
     */
    deleteRole: async (roleName: string): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/pessoas/permissoes/${roleName}`);
        return data;
    },

    /**
     * Get users linked to a role
     */
    getRoleUsers: async (roleName: string): Promise<ApiResponse<RoleUsersResponse>> => {
        const { data } = await api.get<ApiResponse<RoleUsersResponse>>(`/pessoas/permissoes/${roleName}/users`);
        return data;
    },

    /**
     * Get direct permissions of a specific user
     */
    getUserPermissions: async (userId: number): Promise<ApiResponse<UserPermissionsResponse>> => {
        const { data } = await api.get<ApiResponse<UserPermissionsResponse>>(
            `/pessoas/permissoes/users/${userId}/permissions`
        );
        return data;
    },

    /**
     * Update direct permissions of a specific user
     */
    updateUserPermissions: async (
        userId: number,
        permissions: string[]
    ): Promise<ApiResponse<void>> => {
        const { data } = await api.put<ApiResponse<void>>(
            `/pessoas/permissoes/users/${userId}/permissions`,
            { permissions }
        );
        return data;
    },
};

export default permissaoService;
