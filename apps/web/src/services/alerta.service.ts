import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams, FilterParams } from "./types";
import { Alert, Destination, AlertLog, AlertSchedule } from "@/types/alertas";

// ==========================================
// DESTINATION TYPES
// ==========================================
export interface CreateDestinationDTO {
    name: string;
    phone_number: string;
    tags?: string[];
    active?: boolean;
}

export interface UpdateDestinationDTO {
    name?: string;
    phone_number?: string;
    tags?: string[];
    active?: boolean;
}

// ==========================================
// ALERT TYPES
// ==========================================
export interface CreateAlertDTO {
    title: string;
    message: string;
    active?: boolean;
    destination_ids: number[];
    schedules: Omit<AlertSchedule, "schedule_id" | "alert_id">[];
}

export interface UpdateAlertDTO {
    title?: string;
    message?: string;
    active?: boolean;
    destination_ids?: number[];
    schedules?: Omit<AlertSchedule, "schedule_id" | "alert_id">[];
}

export interface AlertFilters extends FilterParams {
    destination_id?: number;
}

export interface LogFilters extends FilterParams {
    alert_id?: number;
    destination_id?: number;
    status?: "success" | "failed";
}

// ==========================================
// DESTINATION SERVICE
// ==========================================
export const destinationService = {
    getAll: async (
        params?: ListParams & FilterParams
    ): Promise<PaginatedResponse<Destination>> => {
        const { data } = await api.get<PaginatedResponse<Destination>>("/alertas/destinos", { params });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<Destination>> => {
        const { data } = await api.get<ApiResponse<Destination>>(`/alertas/destinos/${id}`);
        return data;
    },

    create: async (dto: CreateDestinationDTO): Promise<ApiResponse<Destination>> => {
        const { data } = await api.post<ApiResponse<Destination>>("/alertas/destinos", dto);
        return data;
    },

    update: async (id: number, dto: UpdateDestinationDTO): Promise<ApiResponse<Destination>> => {
        const { data } = await api.put<ApiResponse<Destination>>(`/alertas/destinos/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/alertas/destinos/${id}`);
        return data;
    },

    toggleActive: async (id: number): Promise<ApiResponse<Destination>> => {
        const { data } = await api.patch<ApiResponse<Destination>>(`/alertas/destinos/${id}/toggle`);
        return data;
    },
};

// ==========================================
// ALERT SERVICE
// ==========================================
export const alertService = {
    getAll: async (
        params?: ListParams & AlertFilters
    ): Promise<PaginatedResponse<Alert>> => {
        const { data } = await api.get<PaginatedResponse<Alert>>("/alertas", { params });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<Alert>> => {
        const { data } = await api.get<ApiResponse<Alert>>(`/alertas/${id}`);
        return data;
    },

    create: async (dto: CreateAlertDTO): Promise<ApiResponse<Alert>> => {
        const { data } = await api.post<ApiResponse<Alert>>("/alertas", dto);
        return data;
    },

    update: async (id: number, dto: UpdateAlertDTO): Promise<ApiResponse<Alert>> => {
        const { data } = await api.put<ApiResponse<Alert>>(`/alertas/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/alertas/${id}`);
        return data;
    },

    toggleActive: async (id: number): Promise<ApiResponse<Alert>> => {
        const { data } = await api.patch<ApiResponse<Alert>>(`/alertas/${id}/toggle`);
        return data;
    },

    duplicate: async (id: number): Promise<ApiResponse<Alert>> => {
        const { data } = await api.post<ApiResponse<Alert>>(`/alertas/${id}/duplicate`);
        return data;
    },

    sendNow: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.post<ApiResponse<void>>(`/alertas/${id}/send`);
        return data;
    },
};

// ==========================================
// ALERT LOG SERVICE
// ==========================================
export const alertLogService = {
    getAll: async (
        params?: ListParams & LogFilters
    ): Promise<PaginatedResponse<AlertLog>> => {
        const { data } = await api.get<PaginatedResponse<AlertLog>>("/alertas/logs", { params });
        return data;
    },

    getByAlertId: async (
        alertId: number,
        params?: ListParams
    ): Promise<PaginatedResponse<AlertLog>> => {
        const { data } = await api.get<PaginatedResponse<AlertLog>>(
            `/alertas/${alertId}/logs`,
            { params }
        );
        return data;
    },

    retry: async (logId: number): Promise<ApiResponse<AlertLog>> => {
        const { data } = await api.post<ApiResponse<AlertLog>>(`/alertas/logs/${logId}/retry`);
        return data;
    },
};

// ==========================================
// DASHBOARD SERVICE
// ==========================================
export const alertDashboardService = {
    getStats: async (): Promise<ApiResponse<{
        total_destinations: number;
        active_destinations: number;
        total_alerts: number;
        active_alerts: number;
        today_sent: number;
        today_failed: number;
    }>> => {
        const { data } = await api.get("/alertas/dashboard/stats");
        return data;
    },

    getNextFirings: async (limit?: number): Promise<ApiResponse<{
        alert_id: number;
        title: string;
        next_fire_at: string;
        destinations_count: number;
    }[]>> => {
        const { data } = await api.get("/alertas/dashboard/next-firings", {
            params: { limit: limit || 5 },
        });
        return data;
    },
};

export default {
    destinations: destinationService,
    alerts: alertService,
    logs: alertLogService,
    dashboard: alertDashboardService,
};
