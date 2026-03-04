/**
 * Audit Log Service
 * Endpoints for system audit logs and user activity tracking
 */

import api from "./api";
import type { PaginatedResponse, ApiResponse } from "./types";

// ==========================================
// TYPES
// ==========================================

export type AuditAction =
    | "create"
    | "update"
    | "delete"
    | "login"
    | "logout"
    | "view"
    | "export"
    | "publish"
    | "unpublish"
    | "send"
    | "approve"
    | "reject";

export type AuditModule =
    | "auth"
    | "users"
    | "roteiros"
    | "alertas"
    | "enquetes"
    | "distribution"
    | "raspagem"
    | "config"
    | "pessoas";

export interface AuditLog {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    user_avatar?: string;
    action: AuditAction;
    module: AuditModule;
    resource_type: string;
    resource_id?: string;
    resource_name?: string;
    description: string;
    ip_address: string;
    user_agent: string;
    metadata?: Record<string, unknown>;
    changes?: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
    };
    created_at: string;
}

export interface AuditLogFilters {
    user_id?: string;
    module?: AuditModule;
    action?: AuditAction;
    resource_type?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
}

export interface AuditStats {
    total_logs: number;
    logs_today: number;
    active_users_today: number;
    most_active_module: AuditModule;
    actions_breakdown: Record<AuditAction, number>;
}

// ==========================================
// SERVICE
// ==========================================

const ENDPOINT = "/audit";

export const auditService = {
    /**
     * Get paginated audit logs with filters
     */
    async getLogs(filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLog>> {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                params.append(key, String(value));
            }
        });

        const { data } = await api.get<PaginatedResponse<AuditLog>>(
            `${ENDPOINT}/logs?${params.toString()}`
        );
        return data;
    },

    /**
     * Get a specific log entry with full details
     */
    async getLogById(id: string): Promise<ApiResponse<AuditLog>> {
        const { data } = await api.get<ApiResponse<AuditLog>>(`${ENDPOINT}/logs/${id}`);
        return data;
    },

    /**
     * Get audit statistics
     */
    async getStats(): Promise<ApiResponse<AuditStats>> {
        const { data } = await api.get<ApiResponse<AuditStats>>(`${ENDPOINT}/stats`);
        return data;
    },

    /**
     * Get activity for a specific user
     */
    async getUserActivity(
        userId: string,
        filters: Omit<AuditLogFilters, "user_id"> = {}
    ): Promise<PaginatedResponse<AuditLog>> {
        return this.getLogs({ ...filters, user_id: userId });
    },

    /**
     * Export logs to CSV/Excel
     */
    async exportLogs(
        filters: AuditLogFilters,
        format: "csv" | "xlsx" = "csv"
    ): Promise<Blob> {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                params.append(key, String(value));
            }
        });
        params.append("format", format);

        const { data } = await api.get(`${ENDPOINT}/export?${params.toString()}`, {
            responseType: "blob",
        });
        return data;
    },

    /**
     * Get unique users who have activity logs
     */
    async getActiveUsers(): Promise<
        ApiResponse<{ id: string; name: string; email: string }[]>
    > {
        const { data } = await api.get<
            ApiResponse<{ id: string; name: string; email: string }[]>
        >(`${ENDPOINT}/users`);
        return data;
    },
};

export default auditService;
