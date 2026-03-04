import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams } from "./types";
import {
    ExternalEvent,
    EventCategory,
    EventStatusData,
} from "@/types/externas";

// ==========================================
// DTOs
// ==========================================
export interface CreateExternalEventDTO {
    titulo: string;
    category_id: number;
    status_id: number;
    briefing?: string;
    data_hora: string;
    data_hora_fim?: string;
    local: string;
    endereco_completo?: string;
    contato_nome?: string;
    contato_whatsapp?: string;
    observacao_interna?: string;
    colaboradores?: Array<{ user_id: number; funcao?: string }>;
    equipamentos?: Array<{ equipment_id: number; checked?: boolean }>;
}

export interface ExternalEventFilters {
    category_id?: number;
    status_id?: number;
    search?: string;
    data_inicio?: string;
    data_fim?: string;
}

export interface EventStats {
    total: number;
    today: number;
    by_status: Array<{ id: number; name: string; slug: string; icon: string; color: string; count: number }>;
    by_category: Array<{ id: number; name: string; slug: string; icon: string; color: string; count: number }>;
}

// ==========================================
// SERVICE
// ==========================================
export const externaService = {
    // ── Events ─────────────────────────────────
    getAll: async (params?: ListParams & ExternalEventFilters): Promise<PaginatedResponse<ExternalEvent>> => {
        const { data } = await api.get<PaginatedResponse<ExternalEvent>>("/externas", { params });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<ExternalEvent>> => {
        const { data } = await api.get<ApiResponse<ExternalEvent>>(`/externas/${id}`);
        return data;
    },

    getEventLogs: async (id: number): Promise<ApiResponse<ActivityLog[]>> => {
        const { data } = await api.get<ApiResponse<ActivityLog[]>>(`/externas/${id}/logs`);
        return data;
    },

    getUpcoming: async (days: number = 7): Promise<ApiResponse<ExternalEvent[]>> => {
        const { data } = await api.get<ApiResponse<ExternalEvent[]>>(`/externas/proximos/${days}`);
        return data;
    },

    create: async (dto: CreateExternalEventDTO): Promise<ApiResponse<ExternalEvent>> => {
        const { data } = await api.post<ApiResponse<ExternalEvent>>("/externas", dto);
        return data;
    },

    update: async (id: number, dto: Partial<CreateExternalEventDTO>): Promise<ApiResponse<ExternalEvent>> => {
        const { data } = await api.put<ApiResponse<ExternalEvent>>(`/externas/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/externas/${id}`);
        return data;
    },

    changeStatus: async (id: number, status_id: number): Promise<ApiResponse<ExternalEvent>> => {
        const { data } = await api.patch<ApiResponse<ExternalEvent>>(`/externas/${id}/status`, { status_id });
        return data;
    },

    updateChecklist: async (
        id: number,
        equipamentos: Array<{ equipment_id: number; checked: boolean }>
    ): Promise<ApiResponse<ExternalEvent>> => {
        const { data } = await api.patch<ApiResponse<ExternalEvent>>(
            `/externas/${id}/checklist`,
            { equipamentos }
        );
        return data;
    },

    getStats: async (): Promise<ApiResponse<EventStats>> => {
        const { data } = await api.get<ApiResponse<EventStats>>("/externas/stats");
        return data;
    },

    // ── Categories ─────────────────────────────
    getCategories: async (): Promise<ApiResponse<EventCategory[]>> => {
        const { data } = await api.get<ApiResponse<EventCategory[]>>("/externas/categorias");
        return data;
    },

    createCategory: async (dto: { name: string; icon?: string; color?: string }): Promise<ApiResponse<EventCategory>> => {
        const { data } = await api.post<ApiResponse<EventCategory>>("/externas/categorias", dto);
        return data;
    },

    updateCategory: async (id: number, dto: { name?: string; icon?: string; color?: string }): Promise<ApiResponse<EventCategory>> => {
        const { data } = await api.put<ApiResponse<EventCategory>>(`/externas/categorias/${id}`, dto);
        return data;
    },

    deleteCategory: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/externas/categorias/${id}`);
        return data;
    },

    // ── Statuses ───────────────────────────────
    getStatuses: async (): Promise<ApiResponse<EventStatusData[]>> => {
        const { data } = await api.get<ApiResponse<EventStatusData[]>>("/externas/statuses");
        return data;
    },

    createStatus: async (dto: { name: string; icon?: string; color?: string }): Promise<ApiResponse<EventStatusData>> => {
        const { data } = await api.post<ApiResponse<EventStatusData>>("/externas/statuses", dto);
        return data;
    },

    updateStatusItem: async (id: number, dto: { name?: string; icon?: string; color?: string }): Promise<ApiResponse<EventStatusData>> => {
        const { data } = await api.put<ApiResponse<EventStatusData>>(`/externas/statuses/${id}`, dto);
        return data;
    },

    deleteStatus: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/externas/statuses/${id}`);
        return data;
    },

    // ── Equipment Availability ─────────────────
    checkEquipmentAvailability: async (params: {
        data_hora: string;
        data_hora_fim?: string;
        exclude_event_id?: number;
    }): Promise<ApiResponse<Record<number, EquipmentConflict[]>>> => {
        const { data } = await api.get<ApiResponse<Record<number, EquipmentConflict[]>>>(
            "/externas/equipamentos/disponibilidade",
            { params }
        );
        return data;
    },

    getEquipmentSchedule: async (id: number): Promise<ApiResponse<EquipmentScheduleResponse>> => {
        const { data } = await api.get<ApiResponse<EquipmentScheduleResponse>>(
            `/externas/equipamentos/${id}/agenda`
        );
        return data;
    },
};

export interface EquipmentConflict {
    event_id: number;
    titulo: string;
    data_hora: string;
    data_hora_fim?: string;
    local: string;
    status: string;
}

export interface EquipmentScheduleResponse {
    equipment: any;
    events: Array<{
        id: number;
        titulo: string;
        data_hora: string;
        data_hora_fim?: string;
        local: string;
        category: { id: number; name: string; icon: string; color: string };
        status: { id: number; name: string; icon: string; color: string };
    }>;
}

export interface ActivityLog {
    id: number;
    event_id: number;
    user_id: number | null;
    action: string;
    description: string;
    changes: Record<string, { de: string | null; para: string }> | null;
    created_at: string;
    user?: { id: number; name: string } | null;
}

export default externaService;
