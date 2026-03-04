import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissaoService, ModulePermissionData } from "@/services/permissao.service";
import showToast from "@/lib/toast";

// ==========================================
// QUERY KEYS
// ==========================================
const KEYS = {
    all: ["permissoes"] as const,
    roles: () => [...KEYS.all, "roles"] as const,
    roleUsers: (role: string) => [...KEYS.all, "role-users", role] as const,
    userPerms: (id: number) => [...KEYS.all, "user", id] as const,
};

// ==========================================
// QUERIES
// ==========================================

export function usePermissoes() {
    return useQuery({
        queryKey: KEYS.roles(),
        queryFn: async () => {
            const response = await permissaoService.getAll();
            return response;
        },
    });
}

export function useRoleUsers(roleName: string | null) {
    return useQuery({
        queryKey: KEYS.roleUsers(roleName!),
        queryFn: async () => {
            const response = await permissaoService.getRoleUsers(roleName!);
            return response;
        },
        enabled: !!roleName,
    });
}

export function useUserPermissions(userId: number | null) {
    return useQuery({
        queryKey: KEYS.userPerms(userId!),
        queryFn: async () => {
            const response = await permissaoService.getUserPermissions(userId!);
            return response;
        },
        enabled: !!userId,
    });
}

// ==========================================
// MUTATIONS
// ==========================================

export function useUpdateRolePermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            roleName,
            permissions,
        }: {
            roleName: string;
            permissions: Record<string, ModulePermissionData>;
        }) => permissaoService.updateRole(roleName, permissions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.roles() });
            showToast.success("Permissões atualizadas com sucesso!");
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.message || "Erro ao atualizar permissões");
        },
    });
}

export function useCreateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, description }: { name: string; description?: string }) =>
            permissaoService.createRole(name, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.roles() });
            showToast.success("Perfil criado com sucesso!");
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.message || "Erro ao criar perfil");
        },
    });
}

export function useUpdateRoleMeta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roleName, description }: { roleName: string; description: string }) =>
            permissaoService.updateRoleMeta(roleName, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.roles() });
            showToast.success("Perfil atualizado!");
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.message || "Erro ao atualizar perfil");
        },
    });
}

export function useDeleteRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roleName: string) => permissaoService.deleteRole(roleName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.roles() });
            showToast.success("Perfil excluído!");
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.message || "Erro ao excluir perfil");
        },
    });
}

export function useUpdateUserPermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            userId,
            permissions,
        }: {
            userId: number;
            permissions: string[];
        }) => permissaoService.updateUserPermissions(userId, permissions),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: KEYS.userPerms(variables.userId) });
            queryClient.invalidateQueries({ queryKey: KEYS.roles() });
            showToast.success("Permissões do usuário atualizadas!");
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.message || "Erro ao atualizar permissões do usuário");
        },
    });
}
