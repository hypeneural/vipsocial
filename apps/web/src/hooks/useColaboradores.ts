import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colaboradorService, type CollaboratorListParams, type CreateCollaboratorDTO, type UpdateCollaboratorDTO } from "@/services/colaborador.service";
import { toast } from "@/lib/toast";

// ==========================================
// QUERY KEYS
// ==========================================

export const colaboradorKeys = {
    all: ["colaboradores"] as const,
    lists: () => [...colaboradorKeys.all, "list"] as const,
    list: (params?: CollaboratorListParams) => [...colaboradorKeys.lists(), params] as const,
    stats: () => [...colaboradorKeys.all, "stats"] as const,
    aniversarios: (days?: number) => [...colaboradorKeys.all, "aniversarios", days] as const,
    detail: (id: number) => [...colaboradorKeys.all, "detail", id] as const,
};

// ==========================================
// QUERY HOOKS
// ==========================================

/**
 * Fetch all collaborators with filters
 */
export function useColaboradores(params?: CollaboratorListParams) {
    return useQuery({
        queryKey: colaboradorKeys.list(params),
        queryFn: () => colaboradorService.getAll(params),
    });
}

/**
 * Fetch collaborator stats
 */
export function useColaboradorStats() {
    return useQuery({
        queryKey: colaboradorKeys.stats(),
        queryFn: () => colaboradorService.getStats(),
    });
}

/**
 * Fetch upcoming birthdays
 */
export function useAniversarios(days = 30) {
    return useQuery({
        queryKey: colaboradorKeys.aniversarios(days),
        queryFn: () => colaboradorService.getAniversarios(days),
    });
}

/**
 * Fetch single collaborator
 */
export function useColaborador(id: number) {
    return useQuery({
        queryKey: colaboradorKeys.detail(id),
        queryFn: () => colaboradorService.getById(id),
        enabled: !!id,
    });
}

// ==========================================
// MUTATION HOOKS
// ==========================================

/**
 * Create collaborator mutation
 */
export function useCreateColaborador() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCollaboratorDTO) => colaboradorService.create(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: colaboradorKeys.all });
            toast.success(response.message || "Colaborador criado com sucesso!");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Erro ao criar colaborador";
            toast.error(message);
        },
    });
}

/**
 * Update collaborator mutation
 */
export function useUpdateColaborador() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCollaboratorDTO }) =>
            colaboradorService.update(id, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: colaboradorKeys.all });
            toast.success(response.message || "Colaborador atualizado com sucesso!");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Erro ao atualizar colaborador";
            toast.error(message);
        },
    });
}

/**
 * Delete collaborator mutation
 */
export function useDeleteColaborador() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => colaboradorService.delete(id),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: colaboradorKeys.all });
            toast.success(response.message || "Colaborador removido com sucesso!");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Erro ao remover colaborador";
            toast.error(message);
        },
    });
}
