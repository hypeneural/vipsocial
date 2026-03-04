import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService, CreateUserDTO, UpdateUserDTO, UserFilters } from "@/services";
import { ListParams } from "@/services/types";
import { User, UserPreferences } from "@/types/user";
import showToast from "@/lib/toast";

// ==========================================
// QUERY KEYS
// ==========================================
export const userKeys = {
    all: ["users"] as const,
    lists: () => [...userKeys.all, "list"] as const,
    list: (params?: ListParams & UserFilters) => [...userKeys.lists(), params] as const,
    details: () => [...userKeys.all, "detail"] as const,
    detail: (id: number) => [...userKeys.details(), id] as const,
    preferences: () => [...userKeys.all, "preferences"] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Hook to fetch paginated users list
 */
export function useUsers(params?: ListParams & UserFilters) {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => userService.getAll(params),
    });
}

/**
 * Hook to fetch single user
 */
export function useUser(id: number) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => userService.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook to fetch current user preferences
 */
export function useUserPreferences() {
    return useQuery({
        queryKey: userKeys.preferences(),
        queryFn: () => userService.getPreferences(),
    });
}

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Hook to create new user
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserDTO) => userService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            showToast.success("Usuário criado com sucesso!");
        },
        onError: (error: Error) => {
            showToast.error(error.message || "Erro ao criar usuário");
        },
    });
}

/**
 * Hook to update user
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserDTO }) =>
            userService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            showToast.success("Usuário atualizado com sucesso!");
        },
        onError: (error: Error) => {
            showToast.error(error.message || "Erro ao atualizar usuário");
        },
    });
}

/**
 * Hook to delete user
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => userService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            showToast.success("Usuário excluído com sucesso!");
        },
        onError: (error: Error) => {
            showToast.error(error.message || "Erro ao excluir usuário");
        },
    });
}

/**
 * Hook to toggle user active status
 */
export function useToggleUserActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => userService.toggleActive(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
}

/**
 * Hook to update user preferences
 */
export function useUpdatePreferences() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<UserPreferences>) => userService.updatePreferences(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.preferences() });
            showToast.success("Preferências salvas!");
        },
        onError: (error: Error) => {
            showToast.error(error.message || "Erro ao salvar preferências");
        },
    });
}

/**
 * Hook to upload user avatar
 */
export function useUploadAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => userService.uploadAvatar(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
            showToast.success("Avatar atualizado!");
        },
        onError: (error: Error) => {
            showToast.error(error.message || "Erro ao enviar avatar");
        },
    });
}
