import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams, FilterParams } from "./types";

// ==========================================
// TYPES
// ==========================================
export type PollStatus = "active" | "scheduled" | "ended" | "draft";

export interface PollOption {
    id: number;
    text: string;
    votes: number;
    percentage: number;
    ordem: number;
}

export interface Poll {
    id: number;
    question: string;
    options: PollOption[];
    status: PollStatus;
    total_votes: number;
    allow_multiple: boolean;
    start_date?: string;
    end_date?: string;
    channels: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePollDTO {
    question: string;
    options: { text: string; ordem: number }[];
    allow_multiple?: boolean;
    start_date?: string;
    end_date?: string;
    channels?: string[];
    status?: PollStatus;
}

export interface UpdatePollDTO {
    question?: string;
    options?: { id?: number; text: string; ordem: number }[];
    allow_multiple?: boolean;
    start_date?: string;
    end_date?: string;
    channels?: string[];
    status?: PollStatus;
}

export interface PollFilters extends FilterParams {
    status?: PollStatus;
    channel?: string;
}

export interface PollStats {
    total: number;
    active: number;
    scheduled: number;
    ended: number;
    draft: number;
    total_votes: number;
}

// ==========================================
// ENQUETE SERVICE
// ==========================================
export const enqueteService = {
    getAll: async (
        params?: ListParams & PollFilters
    ): Promise<PaginatedResponse<Poll>> => {
        const { data } = await api.get<PaginatedResponse<Poll>>("/enquetes", { params });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<Poll>> => {
        const { data } = await api.get<ApiResponse<Poll>>(`/enquetes/${id}`);
        return data;
    },

    create: async (dto: CreatePollDTO): Promise<ApiResponse<Poll>> => {
        const { data } = await api.post<ApiResponse<Poll>>("/enquetes", dto);
        return data;
    },

    update: async (id: number, dto: UpdatePollDTO): Promise<ApiResponse<Poll>> => {
        const { data } = await api.put<ApiResponse<Poll>>(`/enquetes/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/enquetes/${id}`);
        return data;
    },

    duplicate: async (id: number): Promise<ApiResponse<Poll>> => {
        const { data } = await api.post<ApiResponse<Poll>>(`/enquetes/${id}/duplicate`);
        return data;
    },

    // Status management
    activate: async (id: number): Promise<ApiResponse<Poll>> => {
        const { data } = await api.patch<ApiResponse<Poll>>(`/enquetes/${id}/activate`);
        return data;
    },

    end: async (id: number): Promise<ApiResponse<Poll>> => {
        const { data } = await api.patch<ApiResponse<Poll>>(`/enquetes/${id}/end`);
        return data;
    },

    publishToDraft: async (id: number): Promise<ApiResponse<Poll>> => {
        const { data } = await api.patch<ApiResponse<Poll>>(`/enquetes/${id}/draft`);
        return data;
    },

    // Results
    getResults: async (id: number): Promise<ApiResponse<{
        poll: Poll;
        options: (PollOption & { voters?: string[] })[];
        total_votes: number;
        last_vote_at?: string;
    }>> => {
        const { data } = await api.get(`/enquetes/${id}/resultados`);
        return data;
    },

    // Stats
    getStats: async (): Promise<ApiResponse<PollStats>> => {
        const { data } = await api.get<ApiResponse<PollStats>>("/enquetes/stats");
        return data;
    },

    // Export
    exportResults: async (
        id: number,
        format: "csv" | "xlsx" | "pdf"
    ): Promise<Blob> => {
        const { data } = await api.get(`/enquetes/${id}/export`, {
            params: { format },
            responseType: "blob",
        });
        return data;
    },

    // WhatsApp embed
    getWhatsAppMessage: async (id: number): Promise<ApiResponse<{
        message: string;
        link: string;
    }>> => {
        const { data } = await api.get(`/enquetes/${id}/whatsapp`);
        return data;
    },

    // Vote (public endpoint)
    vote: async (
        id: number,
        optionIds: number[],
        voterInfo?: { name?: string; phone?: string }
    ): Promise<ApiResponse<void>> => {
        const { data } = await api.post<ApiResponse<void>>(`/enquetes/${id}/vote`, {
            option_ids: optionIds,
            ...voterInfo,
        });
        return data;
    },
};

export default enqueteService;
