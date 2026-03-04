import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    destinationService,
    alertService,
    alertLogService,
    alertDashboardService,
    CreateDestinationDTO,
    UpdateDestinationDTO,
    CreateAlertDTO,
    UpdateAlertDTO,
    AlertFilters,
    LogFilters,
} from "@/services";
import { ListParams } from "@/services/types";
import showToast from "@/lib/toast";

// ==========================================
// QUERY KEYS
// ==========================================
export const alertKeys = {
    all: ["alertas"] as const,
    // Destinations
    destinations: () => [...alertKeys.all, "destinations"] as const,
    destinationList: (params?: ListParams) => [...alertKeys.destinations(), "list", params] as const,
    destinationDetail: (id: number) => [...alertKeys.destinations(), "detail", id] as const,
    // Alerts
    alerts: () => [...alertKeys.all, "alerts"] as const,
    alertList: (params?: ListParams & AlertFilters) => [...alertKeys.alerts(), "list", params] as const,
    alertDetail: (id: number) => [...alertKeys.alerts(), "detail", id] as const,
    // Logs
    logs: () => [...alertKeys.all, "logs"] as const,
    logList: (params?: ListParams & LogFilters) => [...alertKeys.logs(), "list", params] as const,
    // Dashboard
    dashboard: () => [...alertKeys.all, "dashboard"] as const,
    stats: () => [...alertKeys.dashboard(), "stats"] as const,
    nextFirings: () => [...alertKeys.dashboard(), "next-firings"] as const,
};

// ==========================================
// DESTINATION HOOKS
// ==========================================

export function useDestinations(params?: ListParams) {
    return useQuery({
        queryKey: alertKeys.destinationList(params),
        queryFn: () => destinationService.getAll(params),
    });
}

export function useDestination(id: number) {
    return useQuery({
        queryKey: alertKeys.destinationDetail(id),
        queryFn: () => destinationService.getById(id),
        enabled: !!id,
    });
}

export function useCreateDestination() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateDestinationDTO) => destinationService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.destinations() });
            showToast.success("Destino criado com sucesso!");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useUpdateDestination() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateDestinationDTO }) =>
            destinationService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: alertKeys.destinationDetail(id) });
            queryClient.invalidateQueries({ queryKey: alertKeys.destinations() });
            showToast.success("Destino atualizado!");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useDeleteDestination() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => destinationService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.destinations() });
            showToast.success("Destino excluído!");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

// ==========================================
// ALERT HOOKS
// ==========================================

export function useAlerts(params?: ListParams & AlertFilters) {
    return useQuery({
        queryKey: alertKeys.alertList(params),
        queryFn: () => alertService.getAll(params),
    });
}

export function useAlert(id: number) {
    return useQuery({
        queryKey: alertKeys.alertDetail(id),
        queryFn: () => alertService.getById(id),
        enabled: !!id,
    });
}

export function useCreateAlert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAlertDTO) => alertService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.alerts() });
            showToast.success("Alerta criado com sucesso!");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useUpdateAlert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAlertDTO }) =>
            alertService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: alertKeys.alertDetail(id) });
            queryClient.invalidateQueries({ queryKey: alertKeys.alerts() });
            showToast.success("Alerta atualizado!");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useDeleteAlert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => alertService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.alerts() });
            showToast.success("Alerta excluído!");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useSendAlertNow() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => alertService.sendNow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.logs() });
            showToast.success("Alerta enviado!");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

// ==========================================
// LOG HOOKS
// ==========================================

export function useAlertLogs(params?: ListParams & LogFilters) {
    return useQuery({
        queryKey: alertKeys.logList(params),
        queryFn: () => alertLogService.getAll(params),
    });
}

export function useRetryAlertLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (logId: number) => alertLogService.retry(logId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.logs() });
            showToast.success("Reenvio programado!");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

// ==========================================
// DASHBOARD HOOKS
// ==========================================

export function useAlertDashboardStats() {
    return useQuery({
        queryKey: alertKeys.stats(),
        queryFn: () => alertDashboardService.getStats(),
        refetchInterval: 60000, // Refetch every minute
    });
}

export function useNextFirings(limit?: number) {
    return useQuery({
        queryKey: alertKeys.nextFirings(),
        queryFn: () => alertDashboardService.getNextFirings(limit),
        refetchInterval: 60000,
    });
}
