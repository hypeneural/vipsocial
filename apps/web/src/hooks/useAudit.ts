/**
 * React Query hooks for Audit Logs
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    auditService,
    type AuditLog,
    type AuditLogFilters,
    type AuditStats,
    type AuditModule,
    type AuditAction,
} from "@/services/audit.service";
import { toast } from "@/lib/toast";

// ==========================================
// QUERY KEYS
// ==========================================

export const auditKeys = {
    all: ["audit"] as const,
    logs: (filters?: AuditLogFilters) => [...auditKeys.all, "logs", filters] as const,
    log: (id: string) => [...auditKeys.all, "log", id] as const,
    stats: () => [...auditKeys.all, "stats"] as const,
    users: () => [...auditKeys.all, "users"] as const,
};

// ==========================================
// HOOKS
// ==========================================

/**
 * Hook to fetch paginated audit logs with filters
 */
export function useAuditLogs(filters: AuditLogFilters = {}) {
    return useQuery({
        queryKey: auditKeys.logs(filters),
        queryFn: async () => {
            return auditService.getLogs(filters);
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Hook to fetch a specific log entry
 */
export function useAuditLog(id: string) {
    return useQuery({
        queryKey: auditKeys.log(id),
        queryFn: async () => {
            return auditService.getLogById(id);
        },
        enabled: !!id,
    });
}

/**
 * Hook to fetch audit stats
 */
export function useAuditStats() {
    return useQuery({
        queryKey: auditKeys.stats(),
        queryFn: async () => {
            return auditService.getStats();
        },
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Hook to fetch active users for filter dropdown
 */
export function useAuditUsers() {
    return useQuery({
        queryKey: auditKeys.users(),
        queryFn: async () => {
            return auditService.getActiveUsers();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to export audit logs
 */
export function useExportAuditLogs() {
    return useMutation({
        mutationFn: async ({
            filters,
            format,
        }: {
            filters: AuditLogFilters;
            format: "csv" | "xlsx";
        }) => {
            return auditService.exportLogs(filters, format);
        },
        onSuccess: (blob, { format }) => {
            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Logs exportados com sucesso!");
        },
        onError: () => {
            toast.error("Erro ao exportar logs");
        },
    });
}

// Re-export types
export type { AuditLog, AuditLogFilters, AuditStats, AuditModule, AuditAction };
