import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams, FilterParams } from "./types";
import {
    DistributionControl,
    Channel,
    Message,
    NewsGrouped,
    DistributionStatus,
} from "@/types/distribution";

// ==========================================
// TYPES
// ==========================================
export interface DistributionFilters extends FilterParams {
    channel?: Channel;
    status?: DistributionStatus;
    news_id?: number;
}

export interface DistributionStats {
    total_news: number;
    total_messages: number;
    sent: number;
    pending: number;
    failed: number;
    deleted: number;
    success_rate: number;
}

export interface ChannelStatus {
    channel: Channel;
    enabled: boolean;
    total_messages: number;
    sent: number;
    pending: number;
    failed: number;
    last_sent_at?: string;
}

export interface UpdateMessageDTO {
    status?: DistributionStatus;
    deleted_at?: string | null;
}

// ==========================================
// DISTRIBUTION SERVICE
// ==========================================
export const distributionService = {
    // Master Switch
    getMasterSwitch: async (): Promise<ApiResponse<DistributionControl>> => {
        const { data } = await api.get<ApiResponse<DistributionControl>>("/distribuicao/master");
        return data;
    },

    toggleMasterSwitch: async (): Promise<ApiResponse<DistributionControl>> => {
        const { data } = await api.patch<ApiResponse<DistributionControl>>("/distribuicao/master/toggle");
        return data;
    },

    // Channel Controls
    getChannelStatus: async (): Promise<ApiResponse<ChannelStatus[]>> => {
        const { data } = await api.get<ApiResponse<ChannelStatus[]>>("/distribuicao/canais");
        return data;
    },

    toggleChannel: async (channel: Channel): Promise<ApiResponse<ChannelStatus>> => {
        const { data } = await api.patch<ApiResponse<ChannelStatus>>(
            `/distribuicao/canais/${channel}/toggle`
        );
        return data;
    },

    // Statistics
    getStats: async (): Promise<ApiResponse<DistributionStats>> => {
        const { data } = await api.get<ApiResponse<DistributionStats>>("/distribuicao/stats");
        return data;
    },

    // News List
    getNews: async (
        params?: ListParams & DistributionFilters
    ): Promise<PaginatedResponse<NewsGrouped>> => {
        const { data } = await api.get<PaginatedResponse<NewsGrouped>>("/distribuicao/noticias", {
            params,
        });
        return data;
    },

    getNewsById: async (id: number): Promise<ApiResponse<NewsGrouped>> => {
        const { data } = await api.get<ApiResponse<NewsGrouped>>(`/distribuicao/noticias/${id}`);
        return data;
    },

    // Messages
    getMessages: async (
        params?: ListParams & DistributionFilters
    ): Promise<PaginatedResponse<Message>> => {
        const { data } = await api.get<PaginatedResponse<Message>>("/distribuicao/mensagens", {
            params,
        });
        return data;
    },

    updateMessage: async (
        messageId: number,
        dto: UpdateMessageDTO
    ): Promise<ApiResponse<Message>> => {
        const { data } = await api.patch<ApiResponse<Message>>(
            `/distribuicao/mensagens/${messageId}`,
            dto
        );
        return data;
    },

    // Bulk Actions
    deleteNewsFromAllChannels: async (newsId: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/distribuicao/noticias/${newsId}`);
        return data;
    },

    deleteNewsFromChannel: async (
        newsId: number,
        channel: Channel
    ): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(
            `/distribuicao/noticias/${newsId}/canais/${channel}`
        );
        return data;
    },

    retryFailed: async (newsId: number): Promise<ApiResponse<void>> => {
        const { data } = await api.post<ApiResponse<void>>(
            `/distribuicao/noticias/${newsId}/retry`
        );
        return data;
    },

    retryFailedByChannel: async (
        newsId: number,
        channel: Channel
    ): Promise<ApiResponse<void>> => {
        const { data } = await api.post<ApiResponse<void>>(
            `/distribuicao/noticias/${newsId}/canais/${channel}/retry`
        );
        return data;
    },

    // Manual Distribution
    distribute: async (
        newsId: number,
        channels: Channel[]
    ): Promise<ApiResponse<Message[]>> => {
        const { data } = await api.post<ApiResponse<Message[]>>("/distribuicao/enviar", {
            news_id: newsId,
            channels,
        });
        return data;
    },
};

export default distributionService;
