import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams, FilterParams } from "./types";
import {
    Alert,
    AlertDispatchRun,
    AlertLog,
    AlertScheduleRule,
    AlertsStats,
    Destination,
    NextFiring,
} from "@/types/alertas";

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

export type CreateAlertScheduleRuleDTO = Omit<
    AlertScheduleRule,
    "schedule_id" | "rule_key" | "created_at" | "updated_at" | "next_fire_at"
>;

export interface CreateAlertDTO {
    title: string;
    message: string;
    active?: boolean;
    destination_ids: number[];
    schedule_rules: CreateAlertScheduleRuleDTO[];
}

export interface UpdateAlertDTO {
    title?: string;
    message?: string;
    active?: boolean;
    destination_ids?: number[];
    schedule_rules?: CreateAlertScheduleRuleDTO[];
}

export interface AlertFilters extends FilterParams {
    destination_id?: number;
    include_inactive?: boolean;
    include_archived?: boolean;
}

export interface DestinationFilters extends FilterParams {
    include_inactive?: boolean;
    include_archived?: boolean;
}

export interface LogFilters extends FilterParams {
    alert_id?: number;
    destination_id?: number;
    status?: "pending" | "success" | "failed" | "cancelled" | "skipped";
    search?: string;
}

export const destinationService = {
    getAll: async (
        params?: ListParams & DestinationFilters
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

    sendNow: async (id: number): Promise<ApiResponse<{ dispatch_run: AlertDispatchRun }>> => {
        const { data } = await api.post<ApiResponse<{ dispatch_run: AlertDispatchRun }>>(`/alertas/${id}/send`);
        return data;
    },
};

export const alertLogService = {
    getAll: async (
        params?: ListParams & LogFilters
    ): Promise<PaginatedResponse<AlertLog>> => {
        const { data } = await api.get<PaginatedResponse<AlertLog>>("/alertas/logs", { params });
        return data;
    },

    getByAlertId: async (
        alertId: number,
        params?: ListParams & Omit<LogFilters, "alert_id">
    ): Promise<PaginatedResponse<AlertLog>> => {
        const { data } = await api.get<PaginatedResponse<AlertLog>>(`/alertas/${alertId}/logs`, { params });
        return data;
    },

    retry: async (logId: string): Promise<ApiResponse<{ dispatch_run: AlertDispatchRun }>> => {
        const { data } = await api.post<ApiResponse<{ dispatch_run: AlertDispatchRun }>>(`/alertas/logs/${logId}/retry`);
        return data;
    },
};

export const alertDashboardService = {
    getStats: async (): Promise<ApiResponse<AlertsStats>> => {
        const { data } = await api.get<ApiResponse<AlertsStats>>("/alertas/dashboard/stats");
        return data;
    },

    getNextFirings: async (limit?: number): Promise<ApiResponse<NextFiring[]>> => {
        const { data } = await api.get<ApiResponse<NextFiring[]>>("/alertas/dashboard/next-firings", {
            params: { limit: limit || 5 },
        });
        return data;
    },

    getRecentLogs: async (limit?: number): Promise<ApiResponse<AlertLog[]>> => {
        const { data } = await api.get<ApiResponse<AlertLog[]>>("/alertas/dashboard/recent-logs", {
            params: { limit: limit || 10 },
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
