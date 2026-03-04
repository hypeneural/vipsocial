import api from "./api";
import { ApiResponse, PaginatedResponse } from "./types";
import { Categoria, Gaveta, Materia, MateriaStatus, NoticiaGaveta, Roteiro, RoteiroStatus, StatusMateria } from "@/types/roteiros";

// ==========================================
// HELPERS
// ==========================================

const buildFilterParams = (filters?: Record<string, string | number | boolean | undefined>) => {
    const params: Record<string, string | number | boolean> = {};

    Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        params[`filter[${key}]`] = value;
    });

    return params;
};

// ==========================================
// ROTEIRO TYPES
// ==========================================

export interface RoteiroFilters {
    status?: RoteiroStatus;
    programa?: string;
    data?: string;
    today?: 0 | 1;
    search?: string;
}

export interface RoteiroListParams {
    page?: number;
    per_page?: number;
    include?: string;
    sort?: string;
    filters?: RoteiroFilters;
}

export interface CreateRoteiroDTO {
    titulo: string;
    data: string;
    programa?: string;
    status?: RoteiroStatus;
    observacoes?: string;
    materias?: CreateMateriaDTO[];
}

export interface UpdateRoteiroDTO {
    titulo?: string;
    data?: string;
    programa?: string;
    status?: RoteiroStatus;
    observacoes?: string;
}

export interface CreateMateriaDTO {
    categoria_id?: number;
    shortcut?: string;
    titulo: string;
    descricao?: string;
    duracao?: string;
    status?: MateriaStatus;
    creditos_gc?: string;
}

export interface UpdateMateriaDTO {
    categoria_id?: number | null;
    shortcut?: string;
    titulo?: string;
    descricao?: string;
    duracao?: string;
    status?: MateriaStatus;
    creditos_gc?: string;
}

export interface ReorderMateriaItemDTO {
    id: number;
    ordem: number;
    shortcut?: string;
}

// ==========================================
// GAVETA TYPES
// ==========================================

export interface GavetaFilters {
    active?: boolean;
    search?: string;
}

export interface GavetaListParams {
    page?: number;
    per_page?: number;
    include?: string;
    filters?: GavetaFilters;
}

export interface CreateGavetaDTO {
    nome: string;
    descricao?: string;
}

export interface UpdateGavetaDTO {
    nome?: string;
    descricao?: string;
    active?: boolean;
}

export interface CreateNoticiaGavetaDTO {
    titulo: string;
    conteudo?: string;
}

export interface UpdateNoticiaGavetaDTO {
    titulo?: string;
    conteudo?: string;
    is_checked?: 0 | 1;
}

// ==========================================
// CATEGORIA TYPES
// ==========================================

export interface CategoriaFilters {
    active?: boolean;
    search?: string;
}

export interface CategoriaListParams {
    page?: number;
    per_page?: number;
    sort?: "nome" | "created_at" | "-nome" | "-created_at";
    filters?: CategoriaFilters;
}

export interface CreateCategoriaDTO {
    nome: string;
}

export interface UpdateCategoriaDTO {
    nome?: string;
    active?: boolean;
}

// ==========================================
// ROTEIRO SERVICE
// ==========================================

export const roteiroService = {
    getAll: async (params?: RoteiroListParams): Promise<PaginatedResponse<Roteiro>> => {
        const queryParams: Record<string, string | number | boolean> = {
            ...(params?.page ? { page: params.page } : {}),
            ...(params?.per_page ? { per_page: params.per_page } : {}),
            ...(params?.include ? { include: params.include } : {}),
            ...(params?.sort ? { sort: params.sort } : {}),
            ...buildFilterParams(params?.filters),
        };

        const { data } = await api.get<PaginatedResponse<Roteiro>>("/roteiros", {
            params: queryParams,
        });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<Roteiro>> => {
        const { data } = await api.get<ApiResponse<Roteiro>>(`/roteiros/${id}`);
        return data;
    },

    getByDate: async (
        date: string,
        include = "materias,materias.categoria"
    ): Promise<PaginatedResponse<Roteiro>> => {
        return roteiroService.getAll({
            page: 1,
            per_page: 1,
            include,
            filters: { data: date },
        });
    },

    create: async (dto: CreateRoteiroDTO): Promise<ApiResponse<Roteiro>> => {
        const { data } = await api.post<ApiResponse<Roteiro>>("/roteiros", dto);
        return data;
    },

    update: async (id: number, dto: UpdateRoteiroDTO): Promise<ApiResponse<Roteiro>> => {
        const { data } = await api.put<ApiResponse<Roteiro>>(`/roteiros/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/roteiros/${id}`);
        return data;
    },

    duplicate: async (id: number): Promise<ApiResponse<Roteiro>> => {
        const { data } = await api.post<ApiResponse<Roteiro>>(`/roteiros/${id}/duplicate`);
        return data;
    },

    addMateria: async (roteiroId: number, dto: CreateMateriaDTO): Promise<ApiResponse<Materia>> => {
        const { data } = await api.post<ApiResponse<Materia>>(`/roteiros/${roteiroId}/materias`, dto);
        return data;
    },

    updateMateria: async (
        roteiroId: number,
        materiaId: number,
        dto: UpdateMateriaDTO
    ): Promise<ApiResponse<Materia>> => {
        const { data } = await api.put<ApiResponse<Materia>>(
            `/roteiros/${roteiroId}/materias/${materiaId}`,
            dto
        );
        return data;
    },

    deleteMateria: async (roteiroId: number, materiaId: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(
            `/roteiros/${roteiroId}/materias/${materiaId}`
        );
        return data;
    },

    reorderMaterias: async (
        roteiroId: number,
        materias: ReorderMateriaItemDTO[]
    ): Promise<ApiResponse<null>> => {
        const { data } = await api.put<ApiResponse<null>>(
            `/roteiros/${roteiroId}/materias/reorder`,
            { materias }
        );
        return data;
    },

    findOrCreate: async (date: string): Promise<ApiResponse<Roteiro>> => {
        const { data } = await api.post<ApiResponse<Roteiro>>(
            `/roteiros/find-or-create`,
            { data: date }
        );
        return data;
    },
};

// ==========================================
// GAVETA SERVICE
// ==========================================

export const gavetaService = {
    getAll: async (params?: GavetaListParams): Promise<PaginatedResponse<Gaveta>> => {
        const queryParams: Record<string, string | number | boolean> = {
            ...(params?.page ? { page: params.page } : {}),
            ...(params?.per_page ? { per_page: params.per_page } : {}),
            ...(params?.include ? { include: params.include } : {}),
            ...buildFilterParams(params?.filters),
        };

        const { data } = await api.get<PaginatedResponse<Gaveta>>("/gavetas", { params: queryParams });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<Gaveta>> => {
        const { data } = await api.get<ApiResponse<Gaveta>>(`/gavetas/${id}`);
        return data;
    },

    create: async (dto: CreateGavetaDTO): Promise<ApiResponse<Gaveta>> => {
        const { data } = await api.post<ApiResponse<Gaveta>>("/gavetas", dto);
        return data;
    },

    update: async (id: number, dto: UpdateGavetaDTO): Promise<ApiResponse<Gaveta>> => {
        const { data } = await api.put<ApiResponse<Gaveta>>(`/gavetas/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/gavetas/${id}`);
        return data;
    },

    addNoticia: async (
        gavetaId: number,
        dto: CreateNoticiaGavetaDTO
    ): Promise<ApiResponse<NoticiaGaveta>> => {
        const { data } = await api.post<ApiResponse<NoticiaGaveta>>(
            `/gavetas/${gavetaId}/noticias`,
            dto
        );
        return data;
    },

    updateNoticia: async (
        gavetaId: number,
        noticiaId: number,
        dto: UpdateNoticiaGavetaDTO
    ): Promise<ApiResponse<NoticiaGaveta>> => {
        const { data } = await api.put<ApiResponse<NoticiaGaveta>>(
            `/gavetas/${gavetaId}/noticias/${noticiaId}`,
            dto
        );
        return data;
    },

    deleteNoticia: async (gavetaId: number, noticiaId: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(
            `/gavetas/${gavetaId}/noticias/${noticiaId}`
        );
        return data;
    },
};

// ==========================================
// CATEGORIA SERVICE
// ==========================================

export const categoriaService = {
    getAll: async (params?: CategoriaListParams): Promise<PaginatedResponse<Categoria>> => {
        const queryParams: Record<string, string | number | boolean> = {
            ...(params?.page ? { page: params.page } : {}),
            ...(params?.per_page ? { per_page: params.per_page } : {}),
            ...(params?.sort ? { sort: params.sort } : {}),
            ...buildFilterParams(params?.filters),
        };

        const { data } = await api.get<PaginatedResponse<Categoria>>("/categorias", {
            params: queryParams,
        });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<Categoria>> => {
        const { data } = await api.get<ApiResponse<Categoria>>(`/categorias/${id}`);
        return data;
    },

    create: async (dto: CreateCategoriaDTO): Promise<ApiResponse<Categoria>> => {
        const { data } = await api.post<ApiResponse<Categoria>>("/categorias", dto);
        return data;
    },

    update: async (id: number, dto: UpdateCategoriaDTO): Promise<ApiResponse<Categoria>> => {
        const { data } = await api.put<ApiResponse<Categoria>>(`/categorias/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/categorias/${id}`);
        return data;
    },
};


// ==========================================
// STATUS MATERIA TYPES
// ==========================================

export interface StatusMateriaListParams {
    page?: number;
    per_page?: number;
    filters?: { active?: boolean; search?: string };
}

export interface CreateStatusMateriaDTO {
    nome: string;
    icone?: string;
    cor?: string;
}

export interface UpdateStatusMateriaDTO {
    nome?: string;
    icone?: string;
    cor?: string;
    active?: boolean;
}

// ==========================================
// STATUS MATERIA SERVICE
// ==========================================

export const statusMateriaService = {
    getAll: async (params?: StatusMateriaListParams): Promise<PaginatedResponse<StatusMateria>> => {
        const queryParams: Record<string, string | number | boolean> = {
            ...(params?.page ? { page: params.page } : {}),
            ...(params?.per_page ? { per_page: params.per_page } : {}),
            ...buildFilterParams(params?.filters as Record<string, string | number | boolean | undefined>),
        };

        const { data } = await api.get<PaginatedResponse<StatusMateria>>("/status-materias", {
            params: queryParams,
        });
        return data;
    },

    create: async (dto: CreateStatusMateriaDTO): Promise<ApiResponse<StatusMateria>> => {
        const { data } = await api.post<ApiResponse<StatusMateria>>("/status-materias", dto);
        return data;
    },

    update: async (id: number, dto: UpdateStatusMateriaDTO): Promise<ApiResponse<StatusMateria>> => {
        const { data } = await api.put<ApiResponse<StatusMateria>>(`/status-materias/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/status-materias/${id}`);
        return data;
    },
};

// ==========================================
// AUDIT LOG TYPES & SERVICE
// ==========================================

export interface AuditLogEntry {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string;
    user_avatar: string | null;
    action: string;
    module: string;
    resource_name: string | null;
    subject_id: string | null;
    description: string;
    changes: { before: Record<string, unknown>; after: Record<string, unknown> } | null;
    created_at: string;
}

export const auditLogService = {
    getMateriaLogs: async (
        roteiroId: number,
        materiaId: number,
        perPage = 50
    ): Promise<{ data: AuditLogEntry[]; meta: { total: number } }> => {
        const { data } = await api.get(`/roteiros/${roteiroId}/materias/${materiaId}/logs`, {
            params: { per_page: perPage },
        });
        return data;
    },

    getLogsByDate: async (
        date: string,
        perPage = 100
    ): Promise<{ data: AuditLogEntry[]; meta: { total: number } }> => {
        const { data } = await api.get(`/roteiros/logs-by-date`, {
            params: { date, per_page: perPage },
        });
        return data;
    },
};

export default {
    roteiros: roteiroService,
    gavetas: gavetaService,
    categorias: categoriaService,
    statusMaterias: statusMateriaService,
    auditLogs: auditLogService,
};
