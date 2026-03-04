import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipamentoService, CreateEquipmentDTO, EquipmentFilters } from "@/services/equipamento.service";
import showToast from "@/lib/toast";

const KEYS = {
    all: ["equipamentos"] as const,
    list: (filters?: EquipmentFilters) => [...KEYS.all, "list", filters] as const,
    stats: () => [...KEYS.all, "stats"] as const,
    categories: () => [...KEYS.all, "categories"] as const,
    statuses: () => [...KEYS.all, "statuses"] as const,
};

// ── Queries ────────────────────────────────

export function useEquipamentos(params?: EquipmentFilters & { per_page?: number }) {
    return useQuery({
        queryKey: KEYS.list(params),
        queryFn: () => equipamentoService.getAll(params),
    });
}

export function useEquipamentoStats() {
    return useQuery({
        queryKey: KEYS.stats(),
        queryFn: () => equipamentoService.getStats(),
    });
}

export function useEquipmentCategories() {
    return useQuery({
        queryKey: KEYS.categories(),
        queryFn: () => equipamentoService.getCategories(),
    });
}

export function useEquipmentStatuses() {
    return useQuery({
        queryKey: KEYS.statuses(),
        queryFn: () => equipamentoService.getStatuses(),
    });
}

// ── Mutations ──────────────────────────────

export function useCreateEquipamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateEquipmentDTO) => equipamentoService.create(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            showToast.success("Equipamento cadastrado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao cadastrar"),
    });
}

export function useUpdateEquipamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateEquipmentDTO> }) =>
            equipamentoService.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            showToast.success("Equipamento atualizado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao atualizar"),
    });
}

export function useDeleteEquipamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => equipamentoService.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            showToast.success("Equipamento excluído!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao excluir"),
    });
}

export function useChangeEquipmentStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status_id }: { id: number; status_id: number }) =>
            equipamentoService.changeStatus(id, status_id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            showToast.success("Status atualizado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao mudar status"),
    });
}

// ── Category Mutations ─────────────────────

export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: { name: string; icon?: string }) => equipamentoService.createCategory(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.categories() });
            qc.invalidateQueries({ queryKey: KEYS.stats() });
            showToast.success("Categoria criada!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao criar categoria"),
    });
}

export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: { name?: string; icon?: string } }) =>
            equipamentoService.updateCategory(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.categories() });
            showToast.success("Categoria atualizada!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao atualizar"),
    });
}

export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => equipamentoService.deleteCategory(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.categories() });
            qc.invalidateQueries({ queryKey: KEYS.stats() });
            showToast.success("Categoria excluída!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao excluir"),
    });
}

// ── Status Mutations ───────────────────────

export function useCreateStatusItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: { name: string; icon?: string; color?: string }) =>
            equipamentoService.createStatus(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.statuses() });
            qc.invalidateQueries({ queryKey: KEYS.stats() });
            showToast.success("Status criado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao criar status"),
    });
}

export function useUpdateStatusItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: { name?: string; icon?: string; color?: string } }) =>
            equipamentoService.updateStatusItem(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.statuses() });
            showToast.success("Status atualizado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao atualizar"),
    });
}

export function useDeleteStatusItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => equipamentoService.deleteStatus(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.statuses() });
            qc.invalidateQueries({ queryKey: KEYS.stats() });
            showToast.success("Status excluído!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao excluir"),
    });
}
