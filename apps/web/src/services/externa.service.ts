import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams } from "./types";
import {
    ExternalEvent,
    EventCategory,
    EventStatusData,
    VipGalleryAdminOptions,
    VipCoverageEvent,
    VipGalleryBanner,
    VipCoverageLogsResponse,
    VipCoverageStats,
    VipGalleryStatus,
    VipLogoAnchor,
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
    is_vip_gallery?: boolean;
    vip_gallery_status?: VipGalleryStatus | null;
    whatsapp_group_id?: string | null;
    gallery_slug?: string | null;
    custom_logo_path?: string | null;
    logo_size_percent?: number | null;
    logo_anchor?: VipLogoAnchor | null;
    logo_offset_x_percent?: number | null;
    logo_offset_y_percent?: number | null;
    allow_pause_command?: boolean;
    allow_delete_command?: boolean;
    pause_command_keyword?: string | null;
    delete_command_keyword?: string | null;
    colaboradores?: Array<{ user_id: number; funcao?: string }>;
    equipamentos?: Array<{ equipment_id: number; checked?: boolean }>;
}

export interface ExternalEventFilters {
    category_id?: number;
    status_id?: number;
    search?: string;
    data_inicio?: string;
    data_fim?: string;
    is_vip_gallery?: boolean;
    vip_gallery_status?: VipGalleryStatus;
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

    getUpcoming: async (days?: number): Promise<ApiResponse<ExternalEvent[]>> => {
        const path = days && days > 0
            ? `/externas/proximos/${days}`
            : "/externas/proximos";
        const { data } = await api.get<ApiResponse<ExternalEvent[]>>(path);
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
    getVipCoverageStats: async (): Promise<ApiResponse<VipCoverageStats>> => {
        const { data } = await api.get<ApiResponse<VipCoverageStats>>("/externas/cobertura-vip/stats");
        return data;
    },

    getVipCoverageEvents: async (
        params?: ListParams & ExternalEventFilters
    ): Promise<PaginatedResponse<VipCoverageEvent>> => {
        const { data } = await api.get<PaginatedResponse<VipCoverageEvent>>("/externas/cobertura-vip", { params });
        return data;
    },

    getVipGalleryOptions: async (): Promise<ApiResponse<VipGalleryAdminOptions>> => {
        const { data } = await api.get<ApiResponse<VipGalleryAdminOptions>>("/vip-gallery/options");
        return data;
    },

    getVipCoverageLogs: async (params?: {
        search?: string;
        routing_status?: string;
        limit?: number;
    }): Promise<ApiResponse<VipCoverageLogsResponse>> => {
        const { data } = await api.get<ApiResponse<VipCoverageLogsResponse>>("/vip-gallery/logs", { params });
        return data;
    },

    uploadVipGalleryLogo: async (
        file: File,
        eventId?: number
    ): Promise<ApiResponse<{ path: string; url?: string | null }>> => {
        const formData = new FormData();
        formData.append("logo", file);

        if (eventId) {
            formData.append("event_id", String(eventId));
        }

        const { data } = await api.post<ApiResponse<{ path: string; url?: string | null }>>(
            "/vip-gallery/logos/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return data;
    },

    uploadVipGalleryBanners: async (
        files: File[],
        eventId: number
    ): Promise<ApiResponse<{ banners: VipGalleryBanner[] }>> => {
        const formData = new FormData();
        formData.append("event_id", String(eventId));

        files.forEach((file) => {
            formData.append("banners[]", file);
        });

        const { data } = await api.post<ApiResponse<{ banners: VipGalleryBanner[] }>>(
            "/vip-gallery/banners/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return data;
    },

    deleteVipGalleryBanner: async (bannerId: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/vip-gallery/banners/${bannerId}`);
        return data;
    },

    reorderVipGalleryBanners: async (
        eventId: number,
        bannerIds: number[]
    ): Promise<ApiResponse<{ banners: VipGalleryBanner[] }>> => {
        const { data } = await api.patch<ApiResponse<{ banners: VipGalleryBanner[] }>>(
            "/vip-gallery/banners/reorder",
            {
                event_id: eventId,
                banner_ids: bannerIds,
            }
        );

        return data;
    },

    downloadAllVipGalleryPhotos: async (
        eventId: number
    ): Promise<ApiResponse<{ download_url: string; file_name: string; total_files: number; generated_at: string }>> => {
        const { data } = await api.post<ApiResponse<{ download_url: string; file_name: string; total_files: number; generated_at: string }>>(
            `/vip-gallery/events/${eventId}/download-all`
        );

        return data;
    },

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
