import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams } from "./types";

// ==========================================
// TYPES
// ==========================================

export interface EquipmentCategory {
    id: number;
    name: string;
    slug: string;
    icon: string;
    sort_order: number;
    equipments_count?: number;
}

export interface EquipmentStatusData {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
    sort_order: number;
    equipments_count?: number;
}

export interface Equipment {
    id: number;
    nome: string;
    category_id: number;
    category?: EquipmentCategory;
    marca?: string;
    modelo?: string;
    patrimonio?: string;
    status_id: number;
    status?: EquipmentStatusData;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

export interface EquipmentStats {
    total: number;
    by_status: Array<{ id: number; name: string; slug: string; icon: string; color: string; count: number }>;
    by_category: Array<{ id: number; name: string; slug: string; icon: string; count: number }>;
}

export interface CreateEquipmentDTO {
    nome: string;
    category_id: number;
    marca?: string;
    modelo?: string;
    patrimonio?: string;
    status_id: number;
    observacoes?: string;
}

export interface EquipmentFilters {
    category_id?: number;
    status_id?: number;
    search?: string;
}

// ==========================================
// SERVICE
// ==========================================
export const equipamentoService = {
    // ── Equipment ────────────────────────────────
    getAll: async (params?: ListParams & EquipmentFilters): Promise<PaginatedResponse<Equipment>> => {
        const { data } = await api.get<PaginatedResponse<Equipment>>("/equipamentos", { params });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<Equipment>> => {
        const { data } = await api.get<ApiResponse<Equipment>>(`/equipamentos/${id}`);
        return data;
    },

    create: async (dto: CreateEquipmentDTO): Promise<ApiResponse<Equipment>> => {
        const { data } = await api.post<ApiResponse<Equipment>>("/equipamentos", dto);
        return data;
    },

    update: async (id: number, dto: Partial<CreateEquipmentDTO>): Promise<ApiResponse<Equipment>> => {
        const { data } = await api.put<ApiResponse<Equipment>>(`/equipamentos/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/equipamentos/${id}`);
        return data;
    },

    changeStatus: async (id: number, status_id: number): Promise<ApiResponse<Equipment>> => {
        const { data } = await api.patch<ApiResponse<Equipment>>(`/equipamentos/${id}/status`, { status_id });
        return data;
    },

    getStats: async (): Promise<ApiResponse<EquipmentStats>> => {
        const { data } = await api.get<ApiResponse<EquipmentStats>>("/equipamentos/stats");
        return data;
    },

    // ── Categories ───────────────────────────────
    getCategories: async (): Promise<ApiResponse<EquipmentCategory[]>> => {
        const { data } = await api.get<ApiResponse<EquipmentCategory[]>>("/equipamentos/categorias");
        return data;
    },

    createCategory: async (dto: { name: string; icon?: string }): Promise<ApiResponse<EquipmentCategory>> => {
        const { data } = await api.post<ApiResponse<EquipmentCategory>>("/equipamentos/categorias", dto);
        return data;
    },

    updateCategory: async (id: number, dto: { name?: string; icon?: string }): Promise<ApiResponse<EquipmentCategory>> => {
        const { data } = await api.put<ApiResponse<EquipmentCategory>>(`/equipamentos/categorias/${id}`, dto);
        return data;
    },

    deleteCategory: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/equipamentos/categorias/${id}`);
        return data;
    },

    // ── Statuses ─────────────────────────────────
    getStatuses: async (): Promise<ApiResponse<EquipmentStatusData[]>> => {
        const { data } = await api.get<ApiResponse<EquipmentStatusData[]>>("/equipamentos/statuses");
        return data;
    },

    createStatus: async (dto: { name: string; icon?: string; color?: string }): Promise<ApiResponse<EquipmentStatusData>> => {
        const { data } = await api.post<ApiResponse<EquipmentStatusData>>("/equipamentos/statuses", dto);
        return data;
    },

    updateStatusItem: async (id: number, dto: { name?: string; icon?: string; color?: string }): Promise<ApiResponse<EquipmentStatusData>> => {
        const { data } = await api.put<ApiResponse<EquipmentStatusData>>(`/equipamentos/statuses/${id}`, dto);
        return data;
    },

    deleteStatus: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/equipamentos/statuses/${id}`);
        return data;
    },
};

export default equipamentoService;
