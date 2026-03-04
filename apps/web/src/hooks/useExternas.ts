import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { externaService, CreateExternalEventDTO, ExternalEventFilters } from "@/services/externa.service";
import showToast from "@/lib/toast";

const KEYS = {
    all: ["externas"] as const,
    list: (filters?: ExternalEventFilters) => [...KEYS.all, "list", filters] as const,
    detail: (id: number) => [...KEYS.all, "detail", id] as const,
    stats: () => [...KEYS.all, "stats"] as const,
    upcoming: (days?: number) => [...KEYS.all, "upcoming", days] as const,
    categories: () => [...KEYS.all, "categories"] as const,
    statuses: () => [...KEYS.all, "statuses"] as const,
    availability: (params?: any) => [...KEYS.all, "availability", params] as const,
    schedule: (id: number) => [...KEYS.all, "schedule", id] as const,
    logs: (id: number) => [...KEYS.all, "logs", id] as const,
};

// ── Queries ────────────────────────────────

export function useExternas(params?: ExternalEventFilters & { per_page?: number }) {
    return useQuery({
        queryKey: KEYS.list(params),
        queryFn: () => externaService.getAll(params),
    });
}

export function useExterna(id: number) {
    return useQuery({
        queryKey: KEYS.detail(id),
        queryFn: () => externaService.getById(id),
        enabled: !!id,
    });
}

export function useExternaStats() {
    return useQuery({
        queryKey: KEYS.stats(),
        queryFn: () => externaService.getStats(),
    });
}

export function useUpcomingExternas(days?: number) {
    return useQuery({
        queryKey: KEYS.upcoming(days),
        queryFn: () => externaService.getUpcoming(days),
    });
}

export function useEventCategories() {
    return useQuery({
        queryKey: KEYS.categories(),
        queryFn: () => externaService.getCategories(),
    });
}

export function useEventStatuses() {
    return useQuery({
        queryKey: KEYS.statuses(),
        queryFn: () => externaService.getStatuses(),
    });
}

// ── Mutations ──────────────────────────────

export function useCreateExterna() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateExternalEventDTO) => externaService.create(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            showToast.success("Evento criado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao criar evento"),
    });
}

export function useUpdateExterna() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateExternalEventDTO> }) =>
            externaService.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            showToast.success("Evento atualizado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao atualizar"),
    });
}

export function useDeleteExterna() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => externaService.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            showToast.success("Evento excluído!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao excluir"),
    });
}

export function useChangeEventStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status_id }: { id: number; status_id: number }) =>
            externaService.changeStatus(id, status_id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            showToast.success("Status atualizado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao atualizar status"),
    });
}

export function useUpdateChecklist() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, equipamentos }: { id: number; equipamentos: Array<{ equipment_id: number; checked: boolean }> }) =>
            externaService.updateChecklist(id, equipamentos),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao atualizar checklist"),
    });
}

// ── Category Mutations ─────────────────────

export function useCreateEventCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: { name: string; icon?: string; color?: string }) =>
            externaService.createCategory(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.categories() });
            showToast.success("Categoria criada!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao criar categoria"),
    });
}

export function useUpdateEventCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: { name?: string; icon?: string; color?: string } }) =>
            externaService.updateCategory(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.categories() });
            showToast.success("Categoria atualizada!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao atualizar"),
    });
}

export function useDeleteEventCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => externaService.deleteCategory(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.categories() });
            showToast.success("Categoria excluída!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao excluir"),
    });
}

// ── Status Mutations ───────────────────────

export function useCreateEventStatusItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: { name: string; icon?: string; color?: string }) =>
            externaService.createStatus(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.statuses() });
            showToast.success("Status criado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao criar status"),
    });
}

export function useUpdateEventStatusItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: { name?: string; icon?: string; color?: string } }) =>
            externaService.updateStatusItem(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.statuses() });
            showToast.success("Status atualizado!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao atualizar"),
    });
}

export function useDeleteEventStatusItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => externaService.deleteStatus(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.statuses() });
            showToast.success("Status excluído!");
        },
        onError: (e: any) => showToast.error(e.response?.data?.message || "Erro ao excluir"),
    });
}

// ── Equipment Availability ─────────────────

export function useEquipmentAvailability(params?: {
    data_hora: string;
    data_hora_fim?: string;
    exclude_event_id?: number;
}) {
    return useQuery({
        queryKey: KEYS.availability(params),
        queryFn: () => externaService.checkEquipmentAvailability(params!),
        enabled: !!params?.data_hora,
    });
}

export function useEquipmentSchedule(equipmentId: number) {
    return useQuery({
        queryKey: KEYS.schedule(equipmentId),
        queryFn: () => externaService.getEquipmentSchedule(equipmentId),
        enabled: !!equipmentId,
    });
}

export function useEventLogs(eventId: number) {
    return useQuery({
        queryKey: KEYS.logs(eventId),
        queryFn: () => externaService.getEventLogs(eventId),
        enabled: !!eventId,
    });
}

