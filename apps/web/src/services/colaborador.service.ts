import api from "./api";
import { ApiResponse, PaginatedResponse } from "./types";

// ==========================================
// TYPES
// ==========================================

export interface Collaborator {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: string;
    department: string | null;
    profile: "admin" | "editor" | "journalist" | "media" | "analyst";
    status: "active" | "inactive";
    active: boolean;
    birth_date: string | null;
    admission_date: string | null;
    years_of_service: number | null;
    days_until_birthday: number | null;
    upcoming_milestone: {
        type: string;
        years: number;
        days_until: number;
    } | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CollaboratorStats {
    total: number;
    active: number;
    birthdays_this_month: number;
    upcoming_milestones: number;
}

export interface CollaboratorAniversariosParams {
    days?: number;
    limit?: number;
    include_milestones?: boolean | 0 | 1;
}

export interface CreateCollaboratorDTO {
    name: string;
    email: string;
    phone?: string;
    department?: string;
    profile: string;
    birth_date?: string;
    admission_date?: string;
    password?: string;
}

export interface UpdateCollaboratorDTO {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    profile?: string;
    birth_date?: string;
    admission_date?: string;
    active?: boolean;
}

export interface CollaboratorListParams {
    page?: number;
    per_page?: number;
    "filter[search]"?: string;
    "filter[profile]"?: string;
    "filter[department]"?: string;
    "filter[active]"?: string;
    sort?: string;
}

// ==========================================
// COLABORADOR SERVICE
// ==========================================

export const colaboradorService = {
    /**
     * List collaborators with filters and pagination
     */
    getAll: async (params?: CollaboratorListParams): Promise<PaginatedResponse<Collaborator>> => {
        const { data } = await api.get<PaginatedResponse<Collaborator>>(
            "/pessoas/colaboradores",
            { params }
        );
        return data;
    },

    /**
     * Get collaborator by ID
     */
    getById: async (id: number): Promise<ApiResponse<Collaborator>> => {
        const { data } = await api.get<ApiResponse<Collaborator>>(
            `/pessoas/colaboradores/${id}`
        );
        return data;
    },

    /**
     * Get stats (total, active, birthdays, milestones)
     */
    getStats: async (): Promise<ApiResponse<CollaboratorStats>> => {
        const { data } = await api.get<ApiResponse<CollaboratorStats>>(
            "/pessoas/colaboradores/stats"
        );
        return data;
    },

    /**
     * Get upcoming celebrations (birthdays + milestones)
     */
    getAniversarios: async (
        paramsOrDays: number | CollaboratorAniversariosParams = 30
    ): Promise<ApiResponse<Collaborator[]>> => {
        const params: CollaboratorAniversariosParams = typeof paramsOrDays === "number"
            ? { days: paramsOrDays }
            : (paramsOrDays ?? {});

        const { data } = await api.get<ApiResponse<Collaborator[]>>(
            "/pessoas/colaboradores/aniversarios",
            { params }
        );
        return data;
    },

    /**
     * Create a new collaborator
     */
    create: async (dto: CreateCollaboratorDTO): Promise<ApiResponse<Collaborator>> => {
        const { data } = await api.post<ApiResponse<Collaborator>>(
            "/pessoas/colaboradores",
            dto
        );
        return data;
    },

    /**
     * Update a collaborator
     */
    update: async (id: number, dto: UpdateCollaboratorDTO): Promise<ApiResponse<Collaborator>> => {
        const { data } = await api.put<ApiResponse<Collaborator>>(
            `/pessoas/colaboradores/${id}`,
            dto
        );
        return data;
    },

    /**
     * Delete a collaborator (soft delete)
     */
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(
            `/pessoas/colaboradores/${id}`
        );
        return data;
    },
};

export default colaboradorService;
